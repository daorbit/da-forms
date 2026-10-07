import { paletteByKey, paletteByType } from '@/lib/fieldPalette';
import type { DragData } from '@/components/builder/dnd';
import classes from '../FormBuilderPage.module.css';

export function DragChip({ data }: { data: DragData }) {
  const item = data.kind === 'palette' ? paletteByKey[data.paletteKey] : paletteByType[data.field.type];
  const label =
    data.kind === 'palette' ? item?.label ?? 'Field' : data.field.label || item?.label || 'Field';
  const Icon = item?.icon;

  return (
    <div className={classes.dragChip}>
      {Icon && (
        <span className={classes.dragChipIcon}>
          <Icon size={14} />
        </span>
      )}
      {label}
    </div>
  );
}
