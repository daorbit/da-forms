import { Anchor, Box, NumberInput, SegmentedControl, Select, Text, TextInput } from '@mantine/core';
import type { FormField, PaymentMode, PaymentProvider, PaymentSettings } from '@/types';
import { flattenFields } from '@/lib/fieldTree';
import {
  CURRENCIES,
  currencySymbol,
  toMajorUnits,
  toMinorUnits,
  paymentFieldProblem,
  paymentStepProblem,
  isChoiceField,
  PRICEABLE_TYPES,
  providerNeedsPhone,
  formCollectsPhone,
} from '@/lib/payment';
import { GatewayLogo } from '@/components/builder/GatewayLogos';
import payClasses from '@/components/builder/GatewayPicker.module.css';
import { FieldPair, PropertySection } from './PropertySection';
import type { SectionProps } from './types';
import classes from './PaymentSection.module.css';

interface Props extends SectionProps {
  allFields: FormField[];
  paymentSettings?: PaymentSettings | null;
  onOpenPaymentSettings?: () => void;
}

export function PaymentSection({ field, set, allFields, paymentSettings, onOpenPaymentSettings }: Props) {
  const setPay = (patch: Partial<NonNullable<FormField['pay']>>) =>
    set({ pay: { mode: 'fixed', currency: 'INR', ...field.pay, ...patch } });

  const amountFieldCandidates = flattenFields(allFields).filter(
    (candidate) => candidate.id !== field.id && PRICEABLE_TYPES.includes(candidate.type)
  );
  const selectedAmountField = field.pay?.amountFieldId
    ? amountFieldCandidates.find((c) => c.id === field.pay?.amountFieldId)
    : undefined;
  const payCurrency = field.pay?.currency ?? 'INR';
  const mode = field.pay?.mode ?? 'fixed';

  const fieldProvider: PaymentProvider = field.pay?.provider ?? paymentSettings?.defaultProvider ?? 'razorpay';
  const providerSettings = paymentSettings?.providers?.[fieldProvider];
  const providerLabel = providerSettings?.label ?? 'Razorpay';
  const paymentReady = Boolean(
    providerSettings?.enabled &&
      (providerSettings.mode === 'live' ? providerSettings.live.keyId : providerSettings.test.keyId)
  );
  const paymentLive = providerSettings?.mode === 'live';
  const state = !paymentSettings ? 'idle' : !paymentReady ? 'off' : paymentLive ? 'live' : 'idle';

  const problem = paymentFieldProblem(field, allFields);
  const stepIssue = paymentStepProblem(allFields);
  const needsPhoneNotice = providerNeedsPhone(fieldProvider) && !formCollectsPhone(allFields);

  return (
    <PropertySection title="Payment" description="What this form charges, and through which gateway.">
      <div className={classes.status}>
        <span className={classes.statusText} data-state={state}>
          <span className={classes.dot} data-state={state} />
          {!paymentSettings
            ? `Checking ${providerLabel}…`
            : !paymentReady
              ? `${providerLabel} not connected`
              : paymentLive
                ? 'Live — charging real payments'
                : 'Test mode — no real money'}
        </span>
        {onOpenPaymentSettings && (
          <Anchor component="button" type="button" size="xs" className={classes.manage} onClick={onOpenPaymentSettings}>
            {paymentReady ? 'Manage' : 'Connect'}
          </Anchor>
        )}
      </div>

      <Box>
        <div className={classes.fieldLabel}>Gateway</div>
        <Box className={payClasses.gatewayPicker}>
          {Object.values(paymentSettings?.providers ?? {}).map((p) => {
            const picked = field.pay?.provider === p.provider;
            const inherited = !field.pay?.provider && paymentSettings?.defaultProvider === p.provider;
            return (
              <button
                key={p.provider}
                type="button"
                aria-pressed={picked}
                className={[
                  payClasses.gatewayOption,
                  picked ? payClasses.gatewayOptionActive : '',
                  inherited ? payClasses.gatewayOptionInherited : '',
                  p.enabled ? '' : payClasses.gatewayOptionIdle,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setPay({ provider: picked ? undefined : p.provider })}
              >
                <GatewayLogo provider={p.provider} height={16} />
                {!p.enabled && (
                  <Text size="9px" c="dimmed" mt={4}>
                    Not connected
                  </Text>
                )}
              </button>
            );
          })}
        </Box>
        <div className={classes.hint}>
          {field.pay?.provider
            ? `Pinned to ${providerLabel}. Click it again to follow the workspace default.`
            : `Following the workspace default${paymentSettings ? ` (${providerLabel})` : ''}.`}
        </div>
      </Box>

      <Box>
        <div className={classes.fieldLabel}>Price</div>
        <SegmentedControl
          fullWidth
          size="xs"
          value={mode}
          onChange={(next) => setPay({ mode: next as PaymentMode })}
          data={[
            { value: 'fixed', label: 'Fixed' },
            { value: 'field', label: 'From a field' },
            { value: 'modifiable', label: 'Respondent decides' },
          ]}
        />
      </Box>

      {mode === 'fixed' && (
        <NumberInput
          label="Amount"
          description="What every respondent pays."
          min={0}
          decimalScale={2}
          prefix={currencySymbol(payCurrency)}
          value={field.pay?.amount ? toMajorUnits(field.pay.amount) : ''}
          onChange={(v) => setPay({ amount: toMinorUnits(Number(v) || 0) })}
        />
      )}

      {mode === 'modifiable' && (
        <>
          <Text size="xs" c="dimmed">
            The respondent types what they want to pay — for donations, or pay-what-you-want.
          </Text>
          <FieldPair>
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
              onChange={(v) => setPay({ maxAmount: v === '' ? undefined : toMinorUnits(Number(v)) })}
            />
          </FieldPair>
          <NumberInput
            label="Suggested amount"
            description="What the box starts at. Optional."
            min={0}
            decimalScale={2}
            prefix={currencySymbol(payCurrency)}
            value={field.pay?.defaultAmount ? toMajorUnits(field.pay.defaultAmount) : ''}
            onChange={(v) => setPay({ defaultAmount: v === '' ? undefined : toMinorUnits(Number(v)) })}
          />
        </>
      )}

      {mode === 'field' && (
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
                optionPrices: isChoiceField(source)
                  ? Object.fromEntries((source?.options ?? []).map((o) => [o, 0]))
                  : undefined,
              });
            }}
            data={amountFieldCandidates.map((candidate) => ({
              value: candidate.id,
              label: `${candidate.label || candidate.type}${isChoiceField(candidate) ? ' (priced per option)' : ''}`,
            }))}
          />

          {field.pay?.optionPrices && (
            <div className={classes.prices}>
              <div className={classes.fieldLabel}>Price per option</div>
              {selectedAmountField &&
                (selectedAmountField.type === 'checkbox' || selectedAmountField.type === 'multipleChoice') && (
                  <Text size="xs" c="dimmed">
                    This field allows several picks — the respondent pays the total of everything they tick.
                  </Text>
                )}
              {(selectedAmountField?.options ?? []).map((option) => (
                <NumberInput
                  key={option}
                  label={option}
                  size="xs"
                  min={0}
                  decimalScale={2}
                  prefix={currencySymbol(payCurrency)}
                  value={field.pay?.optionPrices?.[option] ? toMajorUnits(field.pay.optionPrices[option]) : ''}
                  onChange={(v) =>
                    setPay({
                      optionPrices: { ...field.pay?.optionPrices, [option]: toMinorUnits(Number(v) || 0) },
                    })
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <FieldPair>
        <Select
          label="Currency"
          value={payCurrency}
          onChange={(v) => setPay({ currency: v ?? 'INR' })}
          data={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <TextInput
          label="Description"
          placeholder="Form title"
          value={field.pay?.description ?? ''}
          onChange={(e) => setPay({ description: e.target.value || undefined })}
        />
      </FieldPair>
      {payCurrency !== 'INR' && (
        <div className={classes.hint}>
          Your {providerLabel} account must be enabled for this currency, or checkout will fail.
        </div>
      )}

      {problem && <div className={classes.problem}>{problem}</div>}
      {stepIssue && <div className={classes.problem}>{stepIssue}</div>}
      {needsPhoneNotice && (
        <Box className={payClasses.phoneNotice}>
          <div className={classes.phoneTitle}>{providerLabel} needs a phone number</div>
          <div className={classes.phoneText}>
            This form asks for none, so respondents get an extra “Mobile number” box above the pay button. It reaches{' '}
            {providerLabel} and the receipt, but is not saved as an answer. Add a phone field to collect it properly
            instead.
          </div>
        </Box>
      )}
    </PropertySection>
  );
}
