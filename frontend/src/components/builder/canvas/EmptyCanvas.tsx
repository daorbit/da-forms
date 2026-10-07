import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import type { FieldType } from '@/types';
import { paletteByType } from '@/lib/fieldPalette';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './EmptyCanvas.module.css';

const STARTERS: { type: FieldType; hint: string }[] = [
  { type: 'name', hint: 'First and last' },
  { type: 'email', hint: 'Validated address' },
  { type: 'phone', hint: 'With country code' },
  { type: 'textarea', hint: 'Long answer' },
  { type: 'select', hint: 'Pick one option' },
  { type: 'rating', hint: 'Stars 1–5' },
];

interface Props {
  isOver: boolean;
  onAskAi: () => void;
  onOpenInsert: () => void;
  onQuickAdd: (type: FieldType) => void;
}

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function EmptyCanvas({ isOver, onAskAi, onOpenInsert, onQuickAdd }: Props) {
  if (isOver) {
    return (
      <div className={classes.root} data-over>
        <div className={classes.dropHint}>
          <PlusIcon size={18} />
          Drop to add it here
        </div>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <button
        type="button"
        className={classes.primary}
        onPointerDown={stop}
        onClick={(e) => {
          stop(e);
          onOpenInsert();
        }}
      >
        <span className={classes.primaryIcon}>
          <PlusIcon size={18} strokeWidth={2.4} />
        </span>
        <span className={classes.primaryText}>
          <span className={classes.primaryTitle}>Add your first question</span>
          <span className={classes.primaryHint}>Search every field type</span>
        </span>
        <kbd className={classes.kbd}>/</kbd>
      </button>

      <div className={classes.divider}>
        <span>or start with</span>
      </div>

      <div className={classes.grid}>
        {STARTERS.map(({ type, hint }) => {
          const item = paletteByType[type];
          const Icon = item.icon;
          return (
            <button
              key={type}
              type="button"
              className={classes.tile}
              onPointerDown={stop}
              onClick={(e) => {
                stop(e);
                onQuickAdd(type);
              }}
            >
              <span className={classes.tileIcon}>
                <Icon size={15} strokeWidth={1.8} />
              </span>
              <span className={classes.tileText}>
                <span className={classes.tileLabel}>{item.label}</span>
                <span className={classes.tileHint}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={classes.orbit}
        onPointerDown={stop}
        onClick={(e) => {
          stop(e);
          onAskAi();
        }}
      >
        <OrbitMark size={20} />
        <span>Describe your form and let Orbit build it</span>
        <ArrowRightIcon size={14} className={classes.orbitArrow} />
      </button>
    </div>
  );
}
