import { Button, TagsInput } from '@mantine/core';
import { PlusIcon } from 'lucide-react';
import type { FormField, OwnerRoute } from '@/types';
import { ConditionEditor } from './ConditionEditor';
import { RuleCard, RuleCardSection } from './RuleCard';
import { conditionCandidates, newId, newRule } from './conditionOptions';
import classes from './RuleCardList.module.css';

interface Props {
  routes: OwnerRoute[];
  fields: FormField[];
  onChange: (routes: OwnerRoute[]) => void;
  disabled?: boolean;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function OwnerRoutesEditor({ routes, fields, onChange, disabled }: Props) {
  const candidates = conditionCandidates(fields);

  const patch = (id: string, next: Partial<OwnerRoute>) =>
    onChange(routes.map((route) => (route.id === id ? { ...route, ...next } : route)));

  const add = () => {
    const first = candidates[0];
    if (!first) return;
    onChange([...routes, { id: newId(), when: { match: 'all', rules: [newRule(first.id)] }, emails: [] }]);
  };

  return (
    <div className={classes.list}>
      {routes.map((route, index) => {
        const invalid = route.emails.find((email) => !EMAIL_PATTERN.test(email));
        return (
          <RuleCard
            key={route.id}
            title={`Route ${index + 1}`}
            onRemove={() => onChange(routes.filter((r) => r.id !== route.id))}
          >
            <RuleCardSection label="When">
              <ConditionEditor
                value={route.when}
                candidates={candidates}
                onChange={(when) => patch(route.id, { when: when ?? { match: 'all', rules: [] } })}
                emptyText="Without a condition this route never sends."
              />
            </RuleCardSection>
            <RuleCardSection label="Also send to">
              <TagsInput
                size="xs"
                placeholder="sales@example.com"
                splitChars={[',', ' ', ';']}
                value={route.emails}
                onChange={(emails) => patch(route.id, { emails: emails.map((e) => e.trim()).filter(Boolean) })}
                error={invalid ? `${invalid} is not a valid address` : undefined}
                disabled={disabled}
                aria-label="Recipients"
              />
            </RuleCardSection>
          </RuleCard>
        );
      })}

      <Button
        variant="light"
        size="xs"
        leftSection={<PlusIcon size={14} />}
        onClick={add}
        disabled={disabled || !candidates.length}
        w="fit-content"
      >
        Add a route
      </Button>
    </div>
  );
}
