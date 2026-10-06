import { ThemeIcon } from '@mantine/core';
import { SlidersHorizontalIcon } from 'lucide-react';
import type { FormField, PaymentSettings } from '@/types';
import { optionTypes, paletteByType, staticTypes } from '@/lib/fieldPalette';
import { PanelDrawer } from '@/components/ui/PanelDrawer';
import { BasicsSection } from './properties/BasicsSection';
import { ContentSection } from './properties/ContentSection';
import { ChoicesSection } from './properties/ChoicesSection';
import { RepeaterSection } from './properties/RepeaterSection';
import { PaymentSection } from './properties/PaymentSection';
import { FormulaSection } from './properties/FormulaSection';
import { HiddenValueSection } from './properties/HiddenValueSection';
import { ScoringSection } from './properties/ScoringSection';
import { ValidationSection } from './properties/ValidationSection';
import { AppearanceSection } from './properties/AppearanceSection';
import { LogicSection } from './properties/LogicSection';
import classes from './PropertiesDrawer.module.css';

interface Props {
  field: FormField | null;
  allFields: FormField[];
  onClose: () => void;
  onChange: (id: string, patch: Partial<FormField>) => void;
  paymentSettings?: PaymentSettings | null;
  onOpenPaymentSettings?: () => void;
}

function Sections({
  field,
  allFields,
  set,
  paymentSettings,
  onOpenPaymentSettings,
}: Omit<Props, 'field' | 'onClose' | 'onChange'> & { field: FormField; set: (patch: Partial<FormField>) => void }) {
  if (field.type === 'pageBreak') {
    return <LogicSection field={field} set={set} allFields={allFields} />;
  }

  if (staticTypes.includes(field.type)) {
    return (
      <>
        <ContentSection field={field} set={set} />
        <LogicSection field={field} set={set} allFields={allFields} />
      </>
    );
  }

  const hasOptions = optionTypes.includes(field.type);

  return (
    <>
      <BasicsSection field={field} set={set} />
      {hasOptions && <ChoicesSection field={field} set={set} />}
      {field.type === 'repeater' && <RepeaterSection field={field} set={set} />}
      {field.type === 'payment' && (
        <PaymentSection
          field={field}
          set={set}
          allFields={allFields}
          paymentSettings={paymentSettings}
          onOpenPaymentSettings={onOpenPaymentSettings}
        />
      )}
      {field.type === 'calculated' && <FormulaSection field={field} set={set} allFields={allFields} />}
      {field.type === 'hidden' && <HiddenValueSection field={field} set={set} />}
      <LogicSection field={field} set={set} allFields={allFields} />
      <ValidationSection field={field} set={set} />
      {hasOptions && (field.options?.length ?? 0) > 0 && <ScoringSection field={field} set={set} />}
      <AppearanceSection field={field} set={set} />
    </>
  );
}

export function PropertiesDrawer({
  field,
  allFields,
  onClose,
  onChange,
  paymentSettings,
  onOpenPaymentSettings,
}: Props) {
  const meta = field ? paletteByType[field.type] : null;
  const set = (patch: Partial<FormField>) => field && onChange(field.id, patch);

  return (
    <PanelDrawer
      opened={!!field}
      onClose={onClose}
      size={480}
      bare
      ariaLabel="Field properties"
      iconVariant="plain"
      title={field ? field.label?.trim() || meta?.label || 'Field' : 'Properties'}
      subtitle={
        meta && (
          <span className={classes.subtitle}>
            {meta.label}
            {field?.required && <span className={classes.required}>· Required</span>}
          </span>
        )
      }
      icon={
        meta ? (
          <ThemeIcon variant="light" color={meta.color} size={34} radius="md">
            <meta.icon size={17} strokeWidth={1.8} />
          </ThemeIcon>
        ) : (
          <SlidersHorizontalIcon size={16} />
        )
      }
    >
      {field && (
        <div className={classes.scroll}>
          <div className={classes.body}>
            <Sections
              field={field}
              allFields={allFields}
              set={set}
              paymentSettings={paymentSettings}
              onOpenPaymentSettings={onOpenPaymentSettings}
            />
          </div>
        </div>
      )}
    </PanelDrawer>
  );
}
