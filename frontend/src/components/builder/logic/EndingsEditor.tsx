import { Button, SegmentedControl, Textarea, TextInput } from '@mantine/core';
import { LinkIcon, PlusIcon } from 'lucide-react';
import type { FormEnding, FormField } from '@/types';
import { ConditionEditor } from './ConditionEditor';
import { RuleCard, RuleCardSection } from './RuleCard';
import { conditionCandidates, newId, newRule } from './conditionOptions';
import classes from './RuleCardList.module.css';

interface Props {
  endings: FormEnding[];
  fields: FormField[];
  onChange: (endings: FormEnding[]) => void;
}

export function EndingsEditor({ endings, fields, onChange }: Props) {
  const candidates = conditionCandidates(fields);

  const patch = (id: string, next: Partial<FormEnding>) =>
    onChange(endings.map((ending) => (ending.id === id ? { ...ending, ...next } : ending)));

  const add = () => {
    const first = candidates[0];
    if (!first) return;
    onChange([...endings, { id: newId(), when: { match: 'all', rules: [newRule(first.id)] }, message: '' }]);
  };

  return (
    <div className={classes.list}>
      {endings.map((ending, index) => {
        const mode = ending.redirectUrl !== undefined ? 'redirect' : 'message';
        const urlInvalid = Boolean(ending.redirectUrl) && !/^https?:\/\//i.test(ending.redirectUrl ?? '');
        return (
          <RuleCard
            key={ending.id}
            title={`Ending ${index + 1}`}
            onRemove={() => onChange(endings.filter((e) => e.id !== ending.id))}
          >
            <RuleCardSection label="When">
              <ConditionEditor
                value={ending.when}
                candidates={candidates}
                onChange={(when) => patch(ending.id, { when: when ?? { match: 'all', rules: [] } })}
                emptyText="Without a condition this ending is never used."
              />
            </RuleCardSection>
            <RuleCardSection label="Then">
              <SegmentedControl
                size="xs"
                fullWidth
                value={mode}
                onChange={(next) =>
                  patch(
                    ending.id,
                    next === 'redirect'
                      ? { redirectUrl: ending.redirectUrl ?? '', message: undefined }
                      : { message: ending.message ?? '', redirectUrl: undefined }
                  )
                }
                data={[
                  { value: 'message', label: 'Show a message' },
                  { value: 'redirect', label: 'Redirect to a URL' },
                ]}
              />
              {mode === 'message' ? (
                <Textarea
                  size="xs"
                  autosize
                  minRows={2}
                  placeholder="Thanks — someone from sales will call you today."
                  value={ending.message ?? ''}
                  onChange={(e) => patch(ending.id, { message: e.currentTarget.value })}
                  aria-label="Message"
                />
              ) : (
                <TextInput
                  size="xs"
                  placeholder="https://example.com/thanks"
                  leftSection={<LinkIcon size={14} />}
                  value={ending.redirectUrl ?? ''}
                  onChange={(e) => patch(ending.id, { redirectUrl: e.currentTarget.value })}
                  error={urlInvalid ? 'Start the address with https://' : undefined}
                  aria-label="Redirect URL"
                />
              )}
            </RuleCardSection>
          </RuleCard>
        );
      })}

      <Button
        variant="light"
        size="xs"
        leftSection={<PlusIcon size={14} />}
        onClick={add}
        disabled={!candidates.length}
        w="fit-content"
      >
        Add an ending
      </Button>
    </div>
  );
}
