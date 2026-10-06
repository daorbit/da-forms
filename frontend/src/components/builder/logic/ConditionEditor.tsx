import { Fragment } from 'react';
import { ActionIcon, Button, SegmentedControl, Select, TextInput } from '@mantine/core';
import { PlusIcon, XIcon } from 'lucide-react';
import type { Condition, ConditionGroup, FormField, ShowIfOperator, ShowIfRule } from '@/types';
import { toConditionGroup } from '@/utils/conditionalLogic';
import {
  VALUELESS_OPERATORS,
  choicesFor,
  newRule,
  operatorsFor,
} from './conditionOptions';
import classes from './ConditionEditor.module.css';

interface Props {
  value: Condition | undefined;
  candidates: FormField[];
  onChange: (next: ConditionGroup | undefined) => void;
  emptyText: string;
  addLabel?: string;
}

export function ConditionEditor({ value, candidates, onChange, emptyText, addLabel = 'Add condition' }: Props) {
  const group = toConditionGroup(value);
  const byId = new Map(candidates.map((field) => [field.id, field]));
  const fieldOptions = candidates.map((field) => ({
    value: field.id,
    label: field.label?.trim() || '(untitled field)',
  }));

  const emit = (rules: ShowIfRule[], match = group.match) =>
    onChange(rules.length ? { match, rules } : undefined);

  const patchRule = (index: number, patch: Partial<ShowIfRule>) =>
    emit(group.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));

  const addRule = () => {
    const first = candidates[0];
    if (first) emit([...group.rules, newRule(first.id)]);
  };

  const removeRule = (index: number) => emit(group.rules.filter((_, i) => i !== index));

  if (!group.rules.length) {
    return (
      <div className={classes.editor}>
        <div className={classes.empty}>
          {candidates.length ? emptyText : 'Add another question to the form to build a condition on it.'}
        </div>
        <Button
          variant="light"
          size="xs"
          leftSection={<PlusIcon size={14} />}
          onClick={addRule}
          disabled={!candidates.length}
          w="fit-content"
        >
          {addLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className={classes.editor}>
      {group.rules.length > 1 && (
        <div className={classes.matchRow}>
          <span className={classes.matchLabel}>Match</span>
          <SegmentedControl
            size="xs"
            value={group.match}
            onChange={(match) => emit(group.rules, match as ConditionGroup['match'])}
            data={[
              { value: 'all', label: 'All conditions' },
              { value: 'any', label: 'Any condition' },
            ]}
          />
        </div>
      )}

      {group.rules.map((rule, index) => {
        const target = byId.get(rule.fieldId);
        const operators = operatorsFor(target);
        const choices = choicesFor(target);
        const valueless = VALUELESS_OPERATORS.includes(rule.operator);

        return (
          <Fragment key={index}>
            {index > 0 && (
              <span className={classes.connector}>{group.match === 'any' ? 'or' : 'and'}</span>
            )}
            <div className={classes.rule}>
              <div className={classes.ruleHead}>
                <Select
                  className={classes.ruleField}
                  size="xs"
                  searchable
                  placeholder="Pick a question"
                  data={fieldOptions}
                  value={target ? rule.fieldId : null}
                  allowDeselect={false}
                  onChange={(fieldId) => fieldId && patchRule(index, { fieldId, value: '' })}
                  aria-label="Question"
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => removeRule(index)}
                  aria-label="Remove condition"
                >
                  <XIcon size={14} />
                </ActionIcon>
              </div>
              <div className={classes.ruleBody} data-valueless={valueless || undefined}>
                <Select
                  size="xs"
                  data={operators}
                  value={operators.some((o) => o.value === rule.operator) ? rule.operator : 'equals'}
                  allowDeselect={false}
                  onChange={(operator) => operator && patchRule(index, { operator: operator as ShowIfOperator })}
                  aria-label="Condition"
                />
                {!valueless &&
                  (choices ? (
                    <Select
                      size="xs"
                      placeholder="Pick a value"
                      data={choices}
                      value={rule.value || null}
                      onChange={(next) => patchRule(index, { value: next ?? '' })}
                      aria-label="Value"
                    />
                  ) : (
                    <TextInput
                      size="xs"
                      placeholder="Value"
                      value={rule.value ?? ''}
                      onChange={(e) => patchRule(index, { value: e.currentTarget.value })}
                      aria-label="Value"
                    />
                  ))}
              </div>
            </div>
          </Fragment>
        );
      })}

      <Button
        variant="subtle"
        size="xs"
        leftSection={<PlusIcon size={14} />}
        onClick={addRule}
        w="fit-content"
      >
        Add another condition
      </Button>
    </div>
  );
}
