import { Switch } from '@mantine/core';
import { CheckIcon, CircleCheckIcon, MinusIcon, PlusIcon } from 'lucide-react';
import type { TemplateDiff } from '@/lib/templateSwitch';
import { ChangeGroup } from './ChangeGroup';
import classes from './templateSwitch.module.css';

interface Props {
  diff: TemplateDiff;
  keepExtra: boolean;
  onKeepExtraChange: (value: boolean) => void;
}

export function ChangeSummary({ diff, keepExtra, onKeepExtraChange }: Props) {
  const stats = [
    { tone: 'kept', label: 'Kept', value: diff.kept.length },
    { tone: 'added', label: 'New', value: diff.added.length },
    { tone: 'removed', label: keepExtra ? 'Moved' : 'Removed', value: diff.removed.length },
  ];

  return (
    <div className={classes.summary}>
      {diff.same ? (
        <div className={classes.callout}>
          <CircleCheckIcon size={16} />
          <span>
            All {diff.kept.length} fields already match this template. Their answers carry over, and only the wording
            and design change.
          </span>
        </div>
      ) : (
        <div className={classes.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={classes.stat} data-tone={stat.tone}>
              <span className={classes.statValue}>{stat.value}</span>
              <span className={classes.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      <ChangeGroup
        tone="kept"
        icon={<CheckIcon size={13} strokeWidth={2.6} />}
        title="Kept, answers carry over"
        fields={diff.kept.map((match) => match.current)}
      />
      <ChangeGroup tone="added" icon={<PlusIcon size={13} strokeWidth={2.6} />} title="New from the template" fields={diff.added} />
      <ChangeGroup
        tone="removed"
        icon={<MinusIcon size={13} strokeWidth={2.6} />}
        title={keepExtra ? 'Moved to the end' : 'Not in this template'}
        fields={diff.removed}
      >
        <Switch
          className={classes.keepSwitch}
          size="sm"
          checked={keepExtra}
          onChange={(e) => onKeepExtraChange(e.currentTarget.checked)}
          label="Keep these fields"
          description="Answers you already collected are never deleted."
        />
      </ChangeGroup>

      <p className={classes.note}>The title, description and button text change to the template’s.</p>
    </div>
  );
}
