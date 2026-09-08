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
import { validateField, validateFields, type FieldErrors } from '@/lib/formValidation';
import { usePartialSave } from '@/hooks/usePartialSave';
import { TurnstileGate } from '@/components/TurnstileGate';

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

interface Props {
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
  steps?: FormStep[];
  stepIndicator?: StepIndicator;
  showStepHeadings?: boolean;
  submitting?: boolean;
  collectPartials?: boolean;
  requireCaptcha?: boolean;
  allowResume?: boolean;
  onSaveForLater?: (email: string, partialKey: string) => Promise<void>;
  initialData?: Record<string, string>;
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

 
function resolveDateSentinel(sentinel: string, type: FormField['type']): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (sentinel === '__today__') return type === 'monthYear' ? date.slice(0, 7) : date;
  if (sentinel === '__now__') return type === 'time' ? time : `${date}T${time}`;
  return sentinel;
}

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
  const params = new URLSearchParams(window.location.search);

  for (const field of valueFields(fields)) {
    if (field.type === 'hidden') {
      const fromUrl = field.paramName ? params.get(field.paramName) : null;
      const resolved = fromUrl ?? field.initialValue ?? '';
      if (resolved) values[field.id] = resolved;
      continue;
    }
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

  const [values, setValues] = useState<Record<string, string>>(
    () => initialData ?? initialValues(fields)
  );
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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


  const partial = usePartialSave(formId, Boolean(formId && onSubmit && collectPartials && !initialData));

  useEffect(() => {
    const answered = valueFields(currentPageFields).filter((f) => (values[f.id] ?? '').trim());
    const last = answered[answered.length - 1];
    const all = valueFields(fields);
    partial.save(
      values,
      last?.id,
      last ? all.findIndex((f) => f.id === last.id) : undefined
    );
  }, [values, currentPageFields, fields, partial]);

  useEffect(() => {
    if (!isMultiPage) return;
    if (!hasAdvanced.current) {
      hasAdvanced.current = true;
      return;
    }
    stepHeadingRef.current?.focus();
  }, [pageIndex, isMultiPage]);


  useEffect(() => {
    if (!formId || !onSubmit || initialData) return;
    const first = formRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([tabindex="-1"]), textarea, select'
    );

    const t = window.setTimeout(() => first?.focus({ preventScroll: true }), 80);
    return () => window.clearTimeout(t);
  }, [formId, onSubmit, initialData]);


  function errorsFor(pageFields: FormField[]): FieldErrors {
    return validateFields(valueFields(pageFields), values, (f) => isFieldVisible(f, values));
  }

 
  function focusFirstError(found: FieldErrors) {
    const firstId = valueFields(currentPageFields).find((f) => found[f.id])?.id;
    if (!firstId) return;
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

    const fileMeta: Record<string, { bytes: number }> = {};

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
      // Only once it landed. A cancelled checkout leaves the attempt open, and
      // dropping the key would make the retry write a second partial row beside
      // the first.
      partial.clear();
    }
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
      <div
        key={field.id}
        // Validate on the way out of the field, not only on submit: a bad email
        // flagged the moment focus leaves is fixed there and then, rather than
        // after a failed submit sends the respondent back up the form.
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          if (!isFieldVisible(field, values)) return;
          const message = validateField(field, values[field.id] ?? '');
          setErrors((prev) => {
            if (message) return { ...prev, [field.id]: message };
            if (!prev[field.id]) return prev;
            const next = { ...prev };
            delete next[field.id];
            return next;
          });
          setShowErrors(true);
        }}
      >
      <FieldControl
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
      </div>
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
