import { useMemo, useState } from 'react';
import { Paper, Title, Text, Button, Stack, SimpleGrid, Group, Progress } from '@mantine/core';
import type { FormField, LabelPlacement, SubmitButtonSize, SubmitButtonWidth, SubmitButtonAlign, FormTheme } from '@/types';
import { FieldControl } from '@/components/FieldControl';
import { valueFields } from '@/lib/fieldTree';
import { resolveTextColor } from '@/lib/formTheme';
import { isFieldVisible } from '@/utils/conditionalLogic';
import { uploadFormFile } from '@/lib/api';
import { fileTypes, acceptFor } from '@/lib/fieldPalette';

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
  submitting?: boolean;
  /** Omitted in preview, where nothing is recorded and there is no spam to guard against. */
  onSubmit?: (values: Record<string, string>) => void;
}

const buttonSize: Record<SubmitButtonSize, string> = {
  small: 'xs',
  medium: 'sm',
  large: 'md',
};

/** Top-level `pageBreak` fields split the form; a break never nests inside a grid. */
function splitIntoPages(fields: FormField[]): FormField[][] {
  const pages: FormField[][] = [[]];
  for (const field of fields) {
    if (field.type === 'pageBreak') {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(field);
    }
  }
  return pages;
}

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
  submitting,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pageError, setPageError] = useState(false);
  const textColor = resolveTextColor(theme);
  const accent = theme?.accentColor;

  const pages = useMemo(() => splitIntoPages(fields), [fields]);
  const isMultiPage = pages.length > 1;
  const isLastPage = pageIndex === pages.length - 1;
  const currentPageFields = pages[pageIndex] ?? [];

  /** A required field on this page that's hidden by showIf is excluded — the
   *  same rule submission uses to drop hidden answers. */
  function pageHasMissingRequired(pageFields: FormField[]): boolean {
    return valueFields(pageFields).some(
      (f) => f.required && isFieldVisible(f, values) && !(values[f.id] ?? '').trim()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isMultiPage && !isLastPage) {
      if (pageHasMissingRequired(currentPageFields)) {
        setPageError(true);
        return;
      }
      setPageError(false);
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

    onSubmit?.(honeypot ? { ...submitValues, _hp: honeypot } : submitValues);
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
        onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
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
      />
    );
  }

  return (
    <Paper
      withBorder
      radius="md"
      p="xl"
      style={{
        backgroundColor: theme?.cardBg,
        borderColor: theme?.cardBorder,
        color: textColor,
        // Lets field labels/links pick up the accent without threading a prop
        // through every FieldControl case.
        ...(accent ? ({ '--mantine-color-emerald-6': accent } as React.CSSProperties) : {}),
      }}
    >
      <form onSubmit={handleSubmit}>
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
          <Stack gap={4} mt="md" mb="xs">
            <Text size="xs" c={textColor ? undefined : 'dimmed'} style={textColor ? { color: textColor, opacity: 0.75 } : undefined}>
              Page {pageIndex + 1} of {pages.length}
            </Text>
            <Progress value={((pageIndex + 1) / pages.length) * 100} size="sm" color={accent ? undefined : 'emerald'} />
          </Stack>
        )}

        {pageError && (
          <Text size="sm" c="red" mt="xs">
            Fill in the required fields on this page before continuing.
          </Text>
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
                      setPageError(false);
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
