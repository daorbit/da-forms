import type { ReactNode, SyntheticEvent } from 'react';
import { LayoutTemplateIcon, PlusIcon } from 'lucide-react';
import type { FieldType } from '@/types';
import { paletteByType } from '@/lib/fieldPalette';
import { formTemplates } from '@/lib/templates';
import { OrbitMark } from '@/components/OrbitMark';
import classes from './EmptyCanvas.module.css';

const QUICK: FieldType[] = ['name', 'email', 'phone', 'textarea', 'select', 'rating'];
const TEMPLATE_COUNT = formTemplates.length - 1;

interface Props {
  isOver: boolean;
  onAskAi: () => void;
  onOpenInsert: () => void;
  onOpenTemplates: () => void;
  onQuickAdd: (type: FieldType) => void;
}

function stop(e: SyntheticEvent) {
  e.stopPropagation();
}

function Choice({ icon, title, body, aside, onPick }: { icon: ReactNode; title: string; body: string; aside?: ReactNode; onPick: () => void }) {
  return (
    <button
      type="button"
      className={classes.choice}
      onPointerDown={stop}
      onClick={(e) => {
        stop(e);
        onPick();
      }}
    >
      <span className={classes.choiceTop}>
        <span className={classes.choiceIcon}>{icon}</span>
        {aside}
      </span>
      <span className={classes.choiceTitle}>{title}</span>
      <span className={classes.choiceBody}>{body}</span>
    </button>
  );
}

export function EmptyCanvas({ isOver, onAskAi, onOpenInsert, onOpenTemplates, onQuickAdd }: Props) {
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
      <div className={classes.intro}>
        <p className={classes.title}>Start your form</p>
        <p className={classes.lead}>Pick a starting point. Everything can be changed later.</p>
      </div>

      <div className={classes.choices}>
        <Choice
          icon={<PlusIcon size={18} strokeWidth={2.2} />}
          title="Add a question"
          body="Search every field type"
          aside={<kbd className={classes.kbd}>/</kbd>}
          onPick={onOpenInsert}
        />
        <Choice
          icon={<LayoutTemplateIcon size={18} strokeWidth={1.9} />}
          title="Use a template"
          body={`${TEMPLATE_COUNT} ready-made forms`}
          onPick={onOpenTemplates}
        />
        <Choice icon={<OrbitMark size={22} />} title="Build with Orbit" body="Describe it in a sentence" onPick={onAskAi} />
      </div>

      <div className={classes.quick}>
        <span className={classes.quickLabel}>Quick add</span>
        {QUICK.map((type) => {
          const item = paletteByType[type];
          const Icon = item.icon;
          return (
            <button
              key={type}
              type="button"
              className={classes.chip}
              onPointerDown={stop}
              onClick={(e) => {
                stop(e);
                onQuickAdd(type);
              }}
            >
              <Icon size={13} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
