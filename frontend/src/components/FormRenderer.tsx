import { useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Title, Text, Button, Stack, SimpleGrid, Group } from '@mantine/core';
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
  /** Omitted in preview, where nothing is recorded and there is no spam to guard against. */
  onSubmit?: (values: Record<string, string>) => void;
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

function initialValues(fields: FormField[]) {
  const values: Record<string, string> = {};
  // Walks into grids: a prefilled field inside a column is still prefilled.
  for (const field of valueFields(fields)) {
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
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
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
    const timer = window.setTimeout(() => draft.save(values, pageIndex), 600);
    return () => window.clearTimeout(timer);
  }, [values, pageIndex, formId, draft]);

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

    // Files are only picked up to now — uploaded here, all at once, so a
    // respondent who abandons the form never leaves an orphaned asset behind.
    if (formId) {
      const toUpload = visibleFields.filter((f) => fileTypes.includes(f.type) && pendingFiles[f.id]);
      if (toUpload.length > 0) {
        setIsUploading(true);
        try {
          const uploaded = await Promise.all(
            toUpload.map((f) => uploadFormFile(formId, pendingFiles[f.id], acceptFor(f.type)))
          );
          toUpload.forEach((f, i) => {
            submitValues[f.id] = uploaded[i].url;
          });
        } finally {
          setIsUploading(false);
        }
      }
    }

    // Cleared before the handler runs: a submitted form should not offer to
    // restore itself if the respondent comes back to the page.
    draft.clear();
    onSubmit?.(honeypot ? { ...submitValues, _hp: honeypot } : submitValues);
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
                  loading={submitting}
                  disabled={isUploading}
                  size={buttonSize[submitButtonSize ?? 'medium']}
                  color={accent ? undefined : 'emerald'}
                  style={{ flex: 1, backgroundColor: accent }}
                >
                  {isUploading ? 'Uploading…' : isMultiPage && !isLastPage ? 'Next' : submitLabel || 'Submit'}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </form>
    </Paper>
  );
}
