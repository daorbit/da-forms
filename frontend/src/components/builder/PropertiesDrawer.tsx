import {
  Drawer,
  Stack,
  TextInput,
  Textarea,
  Checkbox,
  SegmentedControl,
  NumberInput,
  Group,
  Text,
  Switch,
  Select,
} from '@mantine/core';
import type { FormField, FieldSize, ShowIfOperator, PaymentMode } from '@/types';
import {
  optionTypes,
  numericTypes,
  textTypes,
  staticTypes,
  paletteByType,
} from '@/lib/fieldPalette';
import { flattenFields } from '@/lib/fieldTree';
import {
  CURRENCIES,
  currencySymbol,
  toMajorUnits,
  toMinorUnits,
  paymentFieldProblem,
  isChoiceField,
  PRICEABLE_TYPES,
} from '@/lib/payment';
import { ChoiceEditor } from '@/components/builder/ChoiceEditor';
import { EmailBodyEditor } from '@/components/builder/EmailBodyEditor';
import classes from './PropertiesDrawer.module.css';

interface Props {
  field: FormField | null;
  /** The full tree, so "show if" can offer every other field as its target. */
  allFields: FormField[];
  onClose: () => void;
  /** Applied immediately — the canvas reflects every keystroke. */
  onChange: (id: string, patch: Partial<FormField>) => void;
}

// Sentinels resolved to an actual date/time at render — never stored as a
// literal, or a form saved today would keep prefilling today's date forever.
const dateDefaultTypes: FormField['type'][] = ['date', 'time', 'datetime', 'monthYear'];
const dateDefaultSentinel: Record<string, string> = {
  date: '__today__',
  time: '__now__',
  datetime: '__now__',
  monthYear: '__today__',
};
const dateDefaultLabel: Record<string, string> = {
  date: "Today's date",
  time: 'Current time',
  datetime: 'Current date & time',
  monthYear: 'Current month',
};

const showIfOperators: { value: ShowIfOperator; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'notEquals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={classes.section}>
      <span className={classes.sectionLabel}>{label}</span>
      <Stack gap="md">{children}</Stack>
    </section>
  );
}

export function PropertiesDrawer({ field, allFields, onClose, onChange }: Props) {
  const meta = field ? paletteByType[field.type] : null;
  const set = (patch: Partial<FormField>) => field && onChange(field.id, patch);

  // Any other value-bearing field, so a grid can't target itself or a static block.
  const showIfCandidates = field
    ? flattenFields(allFields).filter(
        (candidate) => candidate.id !== field.id && candidate.type !== 'grid' && !staticTypes.includes(candidate.type)
      )
    : [];
  // Patches the nested `pay` block without dropping the keys the patch does
  // not mention — a plain `set({ pay })` would replace the whole object and
  // lose the currency every time the amount changed.
  const setPay = (patch: Partial<NonNullable<FormField['pay']>>) =>
    field &&
    onChange(field.id, {
      pay: { mode: 'fixed', currency: 'INR', ...field.pay, ...patch },
    });

  // Numbers and choices can both drive a price; a payment field cannot take
  // its amount from itself.
  const amountFieldCandidates = field
    ? flattenFields(allFields).filter(
        (candidate) => candidate.id !== field.id && PRICEABLE_TYPES.includes(candidate.type)
      )
    : [];

  const selectedAmountField = field?.pay?.amountFieldId
    ? amountFieldCandidates.find((c) => c.id === field.pay?.amountFieldId)
    : undefined;

  const payCurrency = field?.pay?.currency ?? 'INR';

  const paymentProblem =
    field?.type === 'payment' ? paymentFieldProblem(field, allFields) : null;

  const showIfRule = field?.showIf;
  const showIfValueless = showIfRule && (showIfRule.operator === 'isEmpty' || showIfRule.operator === 'isNotEmpty');

  return (
    <Drawer
      opened={!!field}
      onClose={onClose}
      position="right"
      size={520}
      // Mantine writes this onto the content element, which then drives the
      // header and body insets — set to 0 and controlled entirely by our own
      // .header/.body classes below instead, so the two never fight.
      padding={0}
      // The canvas must stay visible and clickable while properties are edited,
      // so changes can be watched as they are typed.
      withOverlay={false}
      lockScroll={false}
      trapFocus={false}
      shadow="lg"
      title={
        meta && (
          <div className={classes.headerBar}>
            <span className={classes.headerTitle}>Properties</span>
            <span className={classes.fieldTypeChip}>
              <meta.icon size={13} stroke={1.7} />
              {meta.label}
            </span>
          </div>
        )
      }
      classNames={{
        header: classes.header,
        title: classes.title,
        body: classes.body,
        content: classes.content,
      }}
    >
      {field && (
        <>
          {field.type === 'richText' ? (
            <Section label="Content">
              {/* The same editor the email composer uses, so formatted copy is
                  authored the same way in both places. */}
              <EmailBodyEditor
                value={field.content ?? ''}
                onChange={(html) => set({ content: html })}
                placeholder="Write the text shown on the form…"
              />
            </Section>
          ) : staticTypes.includes(field.type) ? (
            <Section label="Content">
              <Textarea
                label={field.type === 'heading' ? 'Heading text' : 'Text'}
                value={field.content ?? ''}
                onChange={(e) => set({ content: e.target.value })}
                autosize
                minRows={2}
                disabled={field.type === 'divider' || field.type === 'spacer'}
                description={
                  field.type === 'divider' || field.type === 'spacer'
                    ? 'This element has no editable content.'
                    : undefined
                }
              />
            </Section>
          ) : (
            <>
              <Section label="Basics">
                <TextInput
                  label="Field label"
                  value={field.label}
                  onChange={(e) => set({ label: e.target.value })}
                />

                <Checkbox
                  label="Hide label on the form"
                  checked={field.hideLabel ?? false}
                  onChange={(e) => set({ hideLabel: e.target.checked })}
                />

                <Switch
                  label="Required"
                  description="Respondents cannot submit without answering."
                  checked={field.required}
                  onChange={(e) => set({ required: e.target.checked })}
                />

                <Switch
                  label="Must be unique"
                  description="Rejects a submission whose answer matches an earlier one."
                  checked={field.unique ?? false}
                  onChange={(e) => set({ unique: e.target.checked })}
                />
              </Section>

              <Section label="Conditional logic">
                <Select
                  label="Show this field only if"
                  placeholder="Always shown"
                  clearable
                  data={showIfCandidates.map((candidate) => ({ value: candidate.id, label: candidate.label || '(untitled field)' }))}
                  value={showIfRule?.fieldId ?? null}
                  onChange={(fieldId) =>
                    set({
                      showIf: fieldId ? { fieldId, operator: showIfRule?.operator ?? 'equals', value: showIfRule?.value } : undefined,
                    })
                  }
                />

                {showIfRule && (
                  <Group grow align="flex-end">
                    <Select
                      label="Condition"
                      data={showIfOperators}
                      value={showIfRule.operator}
                      allowDeselect={false}
                      onChange={(operator) =>
                        operator && set({ showIf: { ...showIfRule, operator: operator as ShowIfOperator } })
                      }
                    />
                    {!showIfValueless && (
                      <TextInput
                        label="Value"
                        value={showIfRule.value ?? ''}
                        onChange={(e) => set({ showIf: { ...showIfRule, value: e.target.value } })}
                      />
                    )}
                  </Group>
                )}
              </Section>

              <Section label="Appearance">
                <div>
                  <Text size="sm" fw={500} mb={6}>
                    Field size
                  </Text>
                  <SegmentedControl
                    fullWidth
                    value={field.size ?? 'large'}
                    onChange={(value) => set({ size: value as FieldSize })}
                    disabled={!!field.customWidth}
                    data={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                  />
                </div>

                <Group grow>
                  <NumberInput
                    label="Custom width"
                    description="Pixel width, overriding the size preset above. Leave blank to use it."
                    suffix="px"
                    min={40}
                    value={field.customWidth ?? ''}
                    onChange={(value) => set({ customWidth: value === '' ? undefined : Number(value) })}
                  />
                  <NumberInput
                    label="Custom height"
                    description="Pixel height for this field's input, e.g. a taller text area."
                    suffix="px"
                    min={24}
                    value={field.customHeight ?? ''}
                    onChange={(value) => set({ customHeight: value === '' ? undefined : Number(value) })}
                  />
                </Group>

                <TextInput
                  label="CSS class"
                  description="Extra class name for custom styling, applied to this field's input."
                  value={field.cssClass ?? ''}
                  onChange={(e) => set({ cssClass: e.target.value || undefined })}
                />

                <TextInput
                  label="Placeholder"
                  value={field.placeholder ?? ''}
                  onChange={(e) => set({ placeholder: e.target.value })}
                />

                <Textarea
                  label="Instructions"
                  description="Helper text shown beneath the label."
                  value={field.instructions ?? ''}
                  onChange={(e) => set({ instructions: e.target.value })}
                  autosize
                  minRows={2}
                />

                <TextInput
                  label="Hover text"
                  description="Tooltip shown on hover."
                  value={field.hoverText ?? ''}
                  onChange={(e) => set({ hoverText: e.target.value })}
                />
              </Section>

              {optionTypes.includes(field.type) && (
                <Section label={field.type === 'matrix' ? 'Answer columns' : 'Options'}>
                  <ChoiceEditor
                    options={field.options ?? []}
                    onChange={(options) => set({ options })}
                  />
                </Section>
              )}

              {/* A matrix is rows against those shared columns, so its
                  statements get an editor of their own. */}
              {field.type === 'matrix' && (
                <Section label="Rows">
                  <ChoiceEditor options={field.rows ?? []} onChange={(rows) => set({ rows })} />
                </Section>
              )}

              {field.type === 'payment' && (
                <Section label="Payment">
                  <SegmentedControl
                    fullWidth
                    size="xs"
                    value={field.pay?.mode ?? 'fixed'}
                    onChange={(mode) => setPay({ mode: mode as PaymentMode })}
                    data={[
                      { value: 'fixed', label: 'Fixed' },
                      { value: 'field', label: 'From a field' },
                      { value: 'modifiable', label: 'Respondent decides' },
                    ]}
                  />

                  {(field.pay?.mode ?? 'fixed') === 'fixed' && (
                    <NumberInput
                      label="Amount"
                      description="What every respondent pays."
                      min={0}
                      decimalScale={2}
                      prefix={currencySymbol(payCurrency)}
                      // Stored in minor units, shown in major — the conversion
                      // happens here so nothing downstream has to guess which
                      // one it is holding.
                      value={field.pay?.amount ? toMajorUnits(field.pay.amount) : ''}
                      onChange={(v) => setPay({ amount: toMinorUnits(Number(v) || 0) })}
                    />
                  )}

                  {field.pay?.mode === 'modifiable' && (
                    <>
                      <Text size="xs" c="dimmed">
                        The respondent types what they want to pay — for donations, or
                        pay-what-you-want.
                      </Text>
                      <Group grow>
                        <NumberInput
                          label="Minimum"
                          min={1}
                          decimalScale={2}
                          prefix={currencySymbol(payCurrency)}
                          value={toMajorUnits(field.pay?.minAmount ?? 100)}
                          onChange={(v) => setPay({ minAmount: toMinorUnits(Number(v) || 1) })}
                        />
                        <NumberInput
                          label="Maximum"
                          description="Optional"
                          min={1}
                          decimalScale={2}
                          prefix={currencySymbol(payCurrency)}
                          value={field.pay?.maxAmount ? toMajorUnits(field.pay.maxAmount) : ''}
                          onChange={(v) =>
                            setPay({ maxAmount: v === '' ? undefined : toMinorUnits(Number(v)) })
                          }
                        />
                      </Group>
                      <NumberInput
                        label="Suggested amount"
                        description="What the box starts at. Optional."
                        min={0}
                        decimalScale={2}
                        prefix={currencySymbol(payCurrency)}
                        value={field.pay?.defaultAmount ? toMajorUnits(field.pay.defaultAmount) : ''}
                        onChange={(v) =>
                          setPay({ defaultAmount: v === '' ? undefined : toMinorUnits(Number(v)) })
                        }
                      />
                    </>
                  )}

                  {field.pay?.mode === 'field' && (
                    <>
                      <Select
                        label="Amount comes from"
                        description="The respondent's answer to this field sets the price."
                        placeholder="Pick a field"
                        value={field.pay?.amountFieldId ?? null}
                        onChange={(v) => {
                          const source = amountFieldCandidates.find((c) => c.id === v);
                          setPay({
                            amountFieldId: v ?? undefined,
                            // A choice field prices per option; a number field
                            // uses the answer directly. Switching between them
                            // must not leave the other's config behind.
                            optionPrices: isChoiceField(source)
                              ? Object.fromEntries((source?.options ?? []).map((o) => [o, 0]))
                              : undefined,
                          });
                        }}
                        data={amountFieldCandidates.map((candidate) => ({
                          value: candidate.id,
                          label: `${candidate.label || candidate.type}${
                            isChoiceField(candidate) ? ' (priced per option)' : ''
                          }`,
                        }))}
                      />

                      {/* A choice field needs a price against each option —
                          otherwise picking one would charge nothing. */}
                      {field.pay?.optionPrices && (
                        <Stack gap="xs">
                          <Text size="xs" fw={500}>
                            Price per option
                          </Text>
                          {(selectedAmountField?.options ?? []).map((option) => (
                            <NumberInput
                              key={option}
                              label={option}
                              size="xs"
                              min={0}
                              decimalScale={2}
                              prefix={currencySymbol(payCurrency)}
                              value={
                                field.pay?.optionPrices?.[option]
                                  ? toMajorUnits(field.pay.optionPrices[option])
                                  : ''
                              }
                              onChange={(v) =>
                                setPay({
                                  optionPrices: {
                                    ...field.pay?.optionPrices,
                                    [option]: toMinorUnits(Number(v) || 0),
                                  },
                                })
                              }
                            />
                          ))}
                        </Stack>
                      )}
                    </>
                  )}

                  <Select
                    label="Currency"
                    value={field.pay?.currency ?? 'INR'}
                    onChange={(v) => setPay({ currency: v ?? 'INR' })}
                    data={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
                  />

                  <TextInput
                    label="Description"
                    description="Shown on the payment window. Defaults to the form's title."
                    value={field.pay?.description ?? ''}
                    onChange={(e) => setPay({ description: e.target.value || undefined })}
                  />

                  {paymentProblem && (
                    <Text size="xs" c="orange">
                      {paymentProblem}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed">
                    Charged through the Razorpay account connected in workspace
                    settings. Without one, this form cannot take payments.
                  </Text>
                </Section>
              )}

              {field.type === 'hidden' && (
                <Section label="Value source">
                  <TextInput
                    label="URL parameter"
                    description="Taken from the link's query string, e.g. utm_source."
                    placeholder="utm_source"
                    value={field.paramName ?? ''}
                    onChange={(e) => set({ paramName: e.target.value || undefined })}
                  />
                  <TextInput
                    label="Fallback value"
                    description="Used when the link carries no such parameter."
                    value={field.initialValue ?? ''}
                    onChange={(e) => set({ initialValue: e.target.value || undefined })}
                  />
                </Section>
              )}

              <Section label="Validation & defaults">
                {dateDefaultTypes.includes(field.type) ? (
                  <Select
                    label="Default value"
                    description="Prefilled when the form opens."
                    placeholder="None"
                    clearable
                    data={[{ value: dateDefaultSentinel[field.type], label: dateDefaultLabel[field.type] }]}
                    value={field.initialValue ?? null}
                    onChange={(v) => set({ initialValue: v ?? undefined })}
                  />
                ) : field.type === 'yesNo' ? (
                  <Select
                    label="Default answer"
                    description="Prefilled when the form opens."
                    placeholder="None"
                    clearable
                    data={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    value={field.initialValue ?? null}
                    onChange={(v) => set({ initialValue: v ?? undefined })}
                  />
                ) : field.type === 'terms' || field.type === 'decisionBox' ? (
                  <Switch
                    label="Checked by default"
                    checked={field.initialValue === 'true'}
                    onChange={(e) => set({ initialValue: e.target.checked ? 'true' : undefined })}
                  />
                ) : (
                  <TextInput
                    label="Initial value"
                    description="Prefilled when the form opens."
                    value={field.initialValue ?? ''}
                    onChange={(e) => set({ initialValue: e.target.value })}
                  />
                )}

                {textTypes.includes(field.type) && (
                  <NumberInput
                    label="Character limit"
                    w={180}
                    value={field.maxLength ?? ''}
                    onChange={(value) => set({ maxLength: value === '' ? undefined : Number(value) })}
                  />
                )}

                {field.type === 'regex' && (
                  <TextInput
                    label="Pattern"
                    description="Regular expression the answer must match."
                    value={field.pattern ?? ''}
                    onChange={(e) => set({ pattern: e.target.value })}
                  />
                )}

                {numericTypes.includes(field.type) && (
                  <Group grow>
                    <NumberInput
                      label="Minimum"
                      value={field.min ?? ''}
                      onChange={(value) => set({ min: value === '' ? undefined : Number(value) })}
                    />
                    <NumberInput
                      label="Maximum"
                      value={field.max ?? ''}
                      onChange={(value) => set({ max: value === '' ? undefined : Number(value) })}
                    />
                  </Group>
                )}

                {field.type === 'slider' && (
                  <NumberInput
                    label="Step"
                    w={180}
                    value={field.step ?? 1}
                    onChange={(value) => set({ step: Number(value) || 1 })}
                  />
                )}

                {field.type === 'rating' && (
                  <NumberInput
                    label="Number of stars"
                    w={180}
                    min={2}
                    max={10}
                    value={field.maxRating ?? 5}
                    onChange={(value) => set({ maxRating: Number(value) || 5 })}
                  />
                )}

                {(field.type === 'terms' || field.type === 'decisionBox') && (
                  <Textarea
                    label={field.type === 'terms' ? 'Terms text' : 'Consent text'}
                    value={field.content ?? ''}
                    onChange={(e) => set({ content: e.target.value })}
                    autosize
                    minRows={4}
                  />
                )}
              </Section>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
