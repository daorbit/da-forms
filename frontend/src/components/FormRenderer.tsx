import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  SimpleGrid,
  Group,
  Anchor,
  TextInput,
} from '@mantine/core';
import type {
  FormField,
  FormStep,
  LabelPlacement,
  StepIndicator,
  SubmitButtonSize,
  SubmitButtonWidth,
  SubmitButtonAlign,
  FormTheme,
} from '@/types';
import { FieldControl } from '@/components/FieldControl';
import { StepIndicatorBar } from '@/components/StepIndicatorBar';
import { valueFields } from '@/lib/fieldTree';
import { resolveTextColor } from '@/lib/formTheme';
import { cardSurfaceStyle } from '@/lib/formBackground';
import { resolveSteps, splitIntoPages } from '@/lib/formSteps';
import { isFieldVisible } from '@/utils/conditionalLogic';
import { uploadFormFile } from '@/lib/api';
import { fileTypes, acceptFor } from '@/lib/fieldPalette';
import { validateFields, type FieldErrors } from '@/lib/formValidation';
import { useFormDraft } from '@/hooks/useFormDraft';
import { usePartialSave } from '@/hooks/usePartialSave';
import { TurnstileGate } from '@/components/TurnstileGate';

/**
 * Cloudflare's public site key, the half that belongs in the browser.
 *
 * Absent in a checkout with no captcha configured, which is why every use is
 * guarded — a form with `requireCaptcha` on and no key here renders no
 * challenge, and the server accepts the submission rather than trapping the
 * respondent behind a widget that was never going to appear.
 */
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

interface Props {
  /** The form's id — present only on the respondent-facing render, enabling real file uploads. */
  formId?: string;
  title: string;
  description?: string;
  fields: FormField[];
  hideHeader?: boolean;
  headerAlign?: SubmitButtonAlign;
  labelPlacement?: LabelPlacement;
  submitLabel?: string;
  submitButtonSize?: SubmitButtonSize;
  submitButtonWidth?: SubmitButtonWidth;
  submitButtonAlign?: SubmitButtonAlign;
  theme?: FormTheme;
  /** Per-page names, indexed by page. */
  steps?: FormStep[];
  /** Which progress indicator a multi-step form shows. Defaults to 'progress'. */
  stepIndicator?: StepIndicator;
  /** Renders each step's title/description above its fields. */
  showStepHeadings?: boolean;
  submitting?: boolean;
  /**
   * Mirrors answers to the server as they are typed, so the owner can see where
   * this form loses people. Off unless the owner asked for it.
   */
  collectPartials?: boolean;
  /** Renders a Turnstile challenge before the submit button. */
  requireCaptcha?: boolean;
  /**
   * Offers a "save and finish later" link under the form.
   *
   * Only useful where drafts are already being kept — there is nothing to come
   * back to otherwise — so the page passes the same flag that turns autosave
   * on.
   */
  allowResume?: boolean;
  /** Emails the respondent a link back to their draft. */
  onSaveForLater?: (email: string, partialKey: string) => Promise<void>;
  /**
   * Opens on answers already sent, when the respondent arrived by an edit link.
   * Applied once, in place of the usual URL-and-default prefill.
   */
  initialData?: Record<string, string>;
  /** Omitted in preview, where nothing is recorded and there is no spam to guard against. */
  /**
   * Returning `false` means the submission did not land — a cancelled payment,
   * most often — and the respondent's draft is kept so they can try again
   * without retyping. Anything else counts as accepted.
   *
   * The second argument names this attempt's autosaved row, so the server
   * promotes it rather than storing the finished answers beside the abandoned
   * half of the same visit.
   */
  onSubmit?: (
    values: Record<string, string>,
    partialKey?: string | null
  ) => void | boolean | Promise<void | boolean>;
}

const buttonSize: Record<SubmitButtonSize, string> = {
  small: 'xs',
  medium: 'sm',
  large: 'md',
};

// Resolved fresh on every mount rather than stored literally, or a form
// saved today would keep prefilling today's date on every future visit.
function resolveDateSentinel(sentinel: string, type: FormField['type']): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (sentinel === '__today__') return type === 'monthYear' ? date.slice(0, 7) : date;
  if (sentinel === '__now__') return type === 'time' ? time : `${date}T${time}`;
  return sentinel;
}

/**
 * Turns a canvas data URL into a file the upload endpoint accepts.
 *
 * `fetch(dataUrl)` would be shorter, but it is an async round trip through the
 * network stack for bytes already in memory, and some CSP configurations refuse
 * a `data:` fetch outright.
 */
function dataUrlToFile(dataUrl: string, name: string): File {
  const [header, encoded] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(header)?.[1] ?? 'image/png';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

function initialValues(fields: FormField[]) {
  const values: Record<string, string> = {};
  // Read once: a hidden field's whole job is to carry what the link arrived
  // with, so a later navigation should not change an answer in progress.
  const params = new URLSearchParams(window.location.search);

  // Walks into grids: a prefilled field inside a column is still prefilled.
  for (const field of valueFields(fields)) {
    if (field.type === 'hidden') {
      const fromUrl = field.paramName ? params.get(field.paramName) : null;
      const resolved = fromUrl ?? field.initialValue ?? '';
      if (resolved) values[field.id] = resolved;
      continue;
    }
    // Any field with a `paramName` may be filled from the link, not just a
    // hidden one — the difference between the two is whether the respondent can
    // see and correct what arrived, which is a reason to allow this on visible
    // fields rather than to withhold it. The URL wins over `initialValue` for
    // the same reason it does above: it is the more specific instruction.
    const fromUrl = field.paramName ? params.get(field.paramName) : null;
    if (fromUrl) {
      values[field.id] = fromUrl;
      continue;
    }
    if (!field.initialValue) continue;
    values[field.id] =
      field.initialValue === '__today__' || field.initialValue === '__now__'
        ? resolveDateSentinel(field.initialValue, field.type)
        : field.initialValue;
  }
  return values;
}


/**
 * The respondent-facing form. Shared by the public page and the builder's
 * preview so the two can never drift apart.
 */
export function FormRenderer({
  formId,
  title,
  description,
  fields,
  hideHeader,
  headerAlign,
  labelPlacement,
  submitLabel,
  submitButtonSize,
  submitButtonWidth,
  submitButtonAlign,
  theme,
  steps,
  stepIndicator,
  showStepHeadings,
  submitting,
  collectPartials,
  requireCaptcha,
  allowResume,
  onSaveForLater,
  initialData,
  onSubmit,
}: Props) {
  // An edit link opens on what was actually sent. The URL params and default
  // values that seed a fresh form would be wrong here — they describe how the
  // form starts, not what this person answered.
  const [values, setValues] = useState<Record<string, string>>(
    () => initialData ?? initialValues(fields)
  );
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // The "finish later" affordance, which is a link until it is asked for and an
  // email box afterwards.
  const [savingForLater, setSavingForLater] = useState(false);
  const [savedForLater, setSavedForLater] = useState(false);
  const [sendingResume, setSendingResume] = useState(false);
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeError, setResumeError] = useState<string | undefined>();
  const [pageIndex, setPageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Set once a page has been submitted, so a half-typed email is not marked
  // wrong while it is still being typed.
  const [showErrors, setShowErrors] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const stepHeadingRef = useRef<HTMLDivElement>(null);
  // Skips the first render: focus belongs to the page on load, not to a
  // heading nobody has navigated to yet.
  const hasAdvanced = useRef(false);
  const textColor = resolveTextColor(theme);
  const accent = theme?.accentColor;

  const pages = useMemo(() => splitIntoPages(fields), [fields]);
  const resolvedSteps = useMemo(() => resolveSteps(fields, steps), [fields, steps]);
  const isMultiPage = pages.length > 1;
  const isLastPage = pageIndex === pages.length - 1;
  const currentPageFields = pages[pageIndex] ?? [];
  // Scoped to this page: an error left on a later step is not something the
  // respondent can act on from here.
  const errorCount = valueFields(currentPageFields).filter((f) => errors[f.id]).length;

  /**
   * Moves focus to the new step when a page changes.
   *
   * A stepper that swaps its content without moving focus leaves a keyboard or
   * screen reader user parked on a button that now belongs to a page they can
   * no longer see, with no announcement that anything happened.
   */
  // Only on the respondent-facing render: the builder preview is throwaway, and
  // saving from it would hand a real respondent the author's test answers.
  const draft = useFormDraft(formId, Boolean(formId && onSubmit));

  /**
   * Writes on a pause in typing rather than on every keystroke.
   *
   * Held while a restore is still on offer: saving the empty form underneath
   * the banner would overwrite the very draft being offered.
   */
  useEffect(() => {
    if (!formId || !draft.checked || draft.restored) return;
    const timer = window.setTimeout(() => {
      // A signature is a base64 image — a few hundred KB of a 5MB storage
      // budget, for the one answer easiest to redo. Everything else is kept.
      const signatureIds = new Set(
        valueFields(fields).filter((f) => f.type === 'signature').map((f) => f.id)
      );
      const saveable = Object.fromEntries(
        Object.entries(values).filter(([id]) => !signatureIds.has(id))
      );
      draft.save(saveable, pageIndex);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [values, pageIndex, formId, draft, fields]);

  /**
   * The same answers, mirrored to the server for the owner's drop-off report.
   *
   * Editing an existing response is excluded: those answers are already stored,
   * and saving them again as a "partial" would report the respondent as having
   * abandoned a form they submitted weeks ago.
   */
  const partial = usePartialSave(formId, Boolean(formId && onSubmit && collectPartials && !initialData));

  useEffect(() => {
    if (!draft.checked || draft.restored) return;
    // Where they had got to: the last field on this page carrying an answer.
    // Read from the visible page rather than the whole form so a multi-step
    // form reports the step someone stopped on, not the furthest field they
    // ever filled.
    const answered = valueFields(currentPageFields).filter((f) => (values[f.id] ?? '').trim());
    const last = answered[answered.length - 1];
    const all = valueFields(fields);
    partial.save(
      values,
      last?.id,
      last ? all.findIndex((f) => f.id === last.id) : undefined
    );
  }, [values, currentPageFields, fields, draft.checked, draft.restored, partial]);

  useEffect(() => {
    if (!isMultiPage) return;
    if (!hasAdvanced.current) {
      hasAdvanced.current = true;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [pageIndex, isMultiPage]);

  /** Every problem on a set of fields. A field hidden by showIf is excluded —
   *  the same rule submission uses to drop hidden answers. */
  function errorsFor(pageFields: FormField[]): FieldErrors {
    return validateFields(valueFields(pageFields), values, (f) => isFieldVisible(f, values));
  }

  /**
   * Puts the respondent on the first thing they need to fix.
   *
   * Without this a long step scrolls back to the top on a failed submit and the
   * one bad field can be a screen and a half below the message.
   */
  function focusFirstError(found: FieldErrors) {
    const firstId = valueFields(currentPageFields).find((f) => found[f.id])?.id;
    if (!firstId) return;
    // After paint, so the field is carrying its error state when it is reached.
    requestAnimationFrame(() => {
      const node = formRef.current?.querySelector<HTMLElement>(`[data-field-id="${firstId}"]`);
      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const pageErrors = errorsFor(currentPageFields);
    setErrors(pageErrors);
    setShowErrors(true);
    if (Object.keys(pageErrors).length > 0) {
      focusFirstError(pageErrors);
      return;
    }

    if (isMultiPage && !isLastPage) {
      setShowErrors(false);
      setPageIndex((i) => i + 1);
      return;
    }
    // Drop answers behind a hidden condition so a since-hidden value can't submit.
    const visibleFields = valueFields(fields).filter((f) => isFieldVisible(f, values));
    const visibleIds = new Set(visibleFields.map((f) => f.id));
    const submitValues: Record<string, string> = {};
    for (const [id, v] of Object.entries(values)) {
      if (visibleIds.has(id)) submitValues[id] = v;
    }
    // Byte size of each upload, read off the upload response — carried
    // alongside `submitValues` rather than folded into it, since an answer's
    // value stays a bare URL everywhere else it's read.
    const fileMeta: Record<string, { bytes: number }> = {};

    // Files are only picked up to now — uploaded here, all at once, so a
    // respondent who abandons the form never leaves an orphaned asset behind.
    //
    // A signature joins them: it is drawn as a data URL, but storing that
    // inline would put a base64 blob in the submission and print it as raw
    // text everywhere an answer is shown. Uploaded, it is a URL like any
    // other image.
    if (formId) {
      const files = visibleFields.filter((f) => fileTypes.includes(f.type) && pendingFiles[f.id]);
      const signatures = visibleFields.filter(
        (f) => f.type === 'signature' && (submitValues[f.id] ?? '').startsWith('data:image/')
      );

      if (files.length > 0 || signatures.length > 0) {
        setIsUploading(true);
        try {
          const uploaded = await Promise.all([
            ...files.map((f) => uploadFormFile(formId, pendingFiles[f.id], acceptFor(f.type))),
            ...signatures.map((f) =>
              uploadFormFile(formId, dataUrlToFile(submitValues[f.id], `signature-${f.id}.png`), 'image/*')
            ),
          ]);
          [...files, ...signatures].forEach((f, i) => {
            submitValues[f.id] = uploaded[i].url;
            fileMeta[f.id] = { bytes: uploaded[i].bytes };
          });
          // Written back so a retry after a cancelled payment reuses these
          // URLs instead of uploading the same files a second time and
          // stranding the first copies in storage.
          setValues((prev) => {
            const next = { ...prev };
            [...files, ...signatures].forEach((f, i) => {
              next[f.id] = uploaded[i].url;
            });
            return next;
          });
          setPendingFiles({});
        } finally {
          setIsUploading(false);
        }
      }
    }

    // Kept until the handler says the submission actually landed. A paid form
    // opens a checkout window the respondent may well cancel, and clearing
    // first would throw away everything they typed on the way to a payment
    // that never happened.
    const withFileMeta = Object.keys(fileMeta).length > 0
      ? { ...submitValues, _fileMeta: JSON.stringify(fileMeta) }
      : submitValues;
    const accepted = await onSubmit?.(
      {
        ...withFileMeta,
        ...(honeypot ? { _hp: honeypot } : {}),
        // Absent when the challenge has not resolved. The server decides what
        // that means — a missing token is refused only when it could have
        // verified one.
        ...(captchaToken ? { _captcha: captchaToken } : {}),
      },
      partial.submitKey()
    );
    if (accepted !== false) {
      draft.clear();
      // Only once it landed. A cancelled checkout leaves the attempt open, and
      // dropping the key would make the retry write a second partial row beside
      // the first.
      partial.clear();
    }
  }

  function restoreDraft() {
    if (!draft.restored) return;
    setValues(draft.restored.values);
    setPageIndex(Math.min(draft.restored.pageIndex, pages.length - 1));
    draft.clear();
  }

  /** Grids lay their columns out; everything else is a control. */
  function renderField(field: FormField): React.ReactNode {
    if (!isFieldVisible(field, values)) return null;

    if (field.type === 'grid') {
      return (
        <SimpleGrid key={field.id} cols={{ base: 1, sm: field.columns?.length ?? 1 }} spacing="md">
          {(field.columns ?? []).map((column, index) => (
            <Stack key={index} gap="md">
              {column.map(renderField)}
            </Stack>
          ))}
        </SimpleGrid>
      );
    }

    return (
      <FieldControl
        key={field.id}
        field={field}
        value={values[field.id] ?? ''}
        // A payment field prices itself off other answers, so it needs the
        // whole set rather than just its own.
        allValues={values}
        // The whole form, not this page's fields: a total on the last step is
        // usually adding up answers given on the first.
        siblingFields={valueFields(fields)}
        error={showErrors ? errors[field.id] : undefined}
        onChange={(v) => {
          setValues((prev) => ({ ...prev, [field.id]: v }));
          // Clears the moment the answer becomes acceptable, rather than
          // making someone submit again to find out that they fixed it.
          if (errors[field.id]) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next[field.id];
              return next;
            });
          }
        }}
        onFileSelect={(file) =>
          setPendingFiles((prev) => {
            const next = { ...prev };
            if (file) next[field.id] = file;
            else delete next[field.id];
            return next;
          })
        }
        labelPlacement={labelPlacement}
        labelColor={theme?.labelColor ?? textColor}
        inputBg={theme?.inputBg}
        inputBorder={theme?.inputBorder}
        inputTextColor={theme?.inputTextColor}
        accentColor={accent}
      />
    );
  }

  return (
    <Paper
      withBorder
      radius="md"
      p="xl"
      style={{
        ...cardSurfaceStyle(theme),
        color: textColor,
        // Lets field labels/links pick up the accent without threading a prop
        // through every FieldControl case.
        ...(accent ? ({ '--mantine-color-emerald-6': accent } as React.CSSProperties) : {}),
      }}
    >
      <form onSubmit={handleSubmit} ref={formRef} noValidate>
        {!hideHeader && (
          <>
            <Title order={3} ta={headerAlign ?? 'center'} mb={4} c={textColor}>
              {title || 'Untitled form'}
            </Title>
            {description && (
              <Text
                size="sm"
                ta={headerAlign ?? 'center'}
                mb="lg"
                c={textColor ? undefined : 'dimmed'}
                style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
              >
                {description}
              </Text>
            )}
          </>
        )}

        {isMultiPage && (
          <>
            <StepIndicatorBar
              variant={stepIndicator ?? 'progress'}
              steps={resolvedSteps}
              current={pageIndex}
              accent={accent}
              textColor={textColor}
            />
            {/* Focused on every page change, and worded so what a screen reader
                announces says where the respondent now is. `tabIndex={-1}`
                makes it focusable programmatically without adding a tab stop. */}
            <div
              ref={stepHeadingRef}
              tabIndex={-1}
              aria-live="polite"
              style={{ outline: 'none' }}
            >
              <Text size="xs" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
                {`Step ${pageIndex + 1} of ${pages.length}${
                  resolvedSteps[pageIndex]?.title ? `, ${resolvedSteps[pageIndex].title}` : ''
                }`}
              </Text>
            </div>
          </>
        )}

        {isMultiPage && showStepHeadings && (
          <Stack gap={2} mt="md">
            <Text fw={600} size="md" c={textColor}>
              {resolvedSteps[pageIndex]?.title}
            </Text>
            {resolvedSteps[pageIndex]?.description && (
              <Text
                size="sm"
                c={textColor ? undefined : 'dimmed'}
                style={textColor ? { color: textColor, opacity: 0.75 } : undefined}
              >
                {resolvedSteps[pageIndex].description}
              </Text>
            )}
          </Stack>
        )}

        {draft.restored && (
          <Group
            justify="space-between"
            wrap="nowrap"
            gap="sm"
            mt="md"
            p="xs"
            style={{
              border: `1px solid ${accent ?? 'var(--mantine-color-emerald-6)'}`,
              borderRadius: 8,
            }}
          >
            <Text size="xs" c={textColor}>
              You started filling this in earlier.
            </Text>
            <Group gap={6} wrap="nowrap">
              <Button size="compact-xs" variant="subtle" color="gray" onClick={() => draft.clear()}>
                Start fresh
              </Button>
              <Button
                size="compact-xs"
                onClick={restoreDraft}
                color={accent ? undefined : 'emerald'}
                style={accent ? { backgroundColor: accent } : undefined}
              >
                Restore
              </Button>
            </Group>
          </Group>
        )}

        {/* Announced rather than merely shown: a screen reader user who submits
            gets no other signal that the page did not advance. */}
        <div role="alert" aria-live="assertive">
          {showErrors && errorCount > 0 && (
            <Text size="sm" c="red" mt="xs">
              {errorCount === 1
                ? 'One answer needs fixing before you can continue.'
                : `${errorCount} answers need fixing before you can continue.`}
            </Text>
          )}
        </div>

        <Stack gap="md" mt="lg">
          {fields.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              This form has no fields yet.
            </Text>
          ) : (
            <>
              {currentPageFields.map(renderField)}

              {/* Invisible to a real respondent (off-screen, no tab stop) —
                  a bot's form-filler script still finds and fills it. */}
              <input
                type="text"
                name="_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />

              {/* Only on the last page: the challenge's token is short-lived,
                  and issuing it at the top of a five-minute form would leave it
                  expired by the time the form is sent. */}
              {requireCaptcha && turnstileSiteKey && isLastPage && (
                <TurnstileGate siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
              )}

              <Group
                gap="sm"
                mt="sm"
                style={{
                  alignSelf:
                    submitButtonAlign === 'left' ? 'flex-start' : submitButtonAlign === 'right' ? 'flex-end' : 'center',
                  width: `${submitButtonWidth ?? 100}%`,
                }}
              >
                {isMultiPage && pageIndex > 0 && (
                  <Button
                    type="button"
                    variant="default"
                    size={buttonSize[submitButtonSize ?? 'medium']}
                    onClick={() => {
                      setShowErrors(false);
                      setPageIndex((i) => i - 1);
                    }}
                    style={{ flex: 1 }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  loading={submitting || isUploading}
                  disabled={isUploading}
                  size={buttonSize[submitButtonSize ?? 'medium']}
                  color={accent ? undefined : 'emerald'}
                  style={{ flex: 1, backgroundColor: accent }}
                >
                  {isUploading ? 'Uploading…' : isMultiPage && !isLastPage ? 'Next' : submitLabel || 'Submit'}
                </Button>
              </Group>

              {/* Under the button rather than beside it: finishing later is the
                  lesser path, and a form offering two equal-weight actions
                  makes people stop to choose between them. */}
              {allowResume && onSaveForLater && !savedForLater && (
                <Stack gap="xs" mt="xs" align="center">
                  {!savingForLater ? (
                    <Anchor
                      component="button"
                      type="button"
                      size="sm"
                      c="dimmed"
                      onClick={() => setSavingForLater(true)}
                    >
                      Save and finish later
                    </Anchor>
                  ) : (
                    <Group gap="xs" wrap="nowrap" style={{ width: '100%', maxWidth: 380 }}>
                      <TextInput
                        type="email"
                        placeholder="you@example.com"
                        size="sm"
                        style={{ flex: 1 }}
                        value={resumeEmail}
                        onChange={(e) => setResumeEmail(e.target.value)}
                        error={resumeError}
                        aria-label="Email to send your draft link to"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        loading={sendingResume}
                        onClick={async () => {
                          const key = partial.submitKey();
                          if (!key) {
                            setResumeError('Answer at least one question first.');
                            return;
                          }
                          setResumeError(undefined);
                          setSendingResume(true);
                          try {
                            await onSaveForLater(resumeEmail, key);
                            setSavedForLater(true);
                          } catch (e) {
                            setResumeError(
                              e instanceof Error ? e.message : 'Could not send the link.'
                            );
                          } finally {
                            setSendingResume(false);
                          }
                        }}
                      >
                        Send link
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}

              {savedForLater && (
                <Text size="sm" c="dimmed" ta="center" mt="xs">
                  Link sent — check your inbox. You can close this page.
                </Text>
              )}
            </>
          )}
        </Stack>
      </form>
    </Paper>
  );
}
