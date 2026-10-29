import { Select, Switch } from '@mantine/core';
import type { PaymentInvoiceConfig } from '@/types';
import { INVOICE_TAX_RATES } from '@/lib/payment';
import classes from './PaymentSection.module.css';

interface Props {
  invoice?: PaymentInvoiceConfig;
  onChange: (invoice: PaymentInvoiceConfig) => void;
}

export function PaymentInvoiceSettings({ invoice, onChange }: Props) {
  const enabled = Boolean(invoice?.enabled);

  return (
    <>
      <Switch
        label="Invoice paid responses"
        description="Create an invoice in Invoicing for each paid response. Needs the Invoicing app on."
        checked={enabled}
        onChange={(e) => onChange({ ...invoice, enabled: e.currentTarget.checked })}
      />
      {enabled && (
        <>
          <Select
            label="Tax included in the price"
            value={String(invoice?.taxRate ?? 0)}
            onChange={(value) => onChange({ ...invoice, enabled, taxRate: Number(value ?? 0) })}
            allowDeselect={false}
            data={INVOICE_TAX_RATES.map((rate) => ({ value: String(rate), label: rate === 0 ? 'No tax' : `${rate}%` }))}
          />
          <div className={classes.hint}>
            The amount paid is the invoice total. Pick a rate to show how much of it is tax.
          </div>
        </>
      )}
    </>
  );
}
