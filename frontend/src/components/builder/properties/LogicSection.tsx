import type { FormField } from '@/types';
import { DOCS } from '@/lib/docs';
import { DocsLink } from '@/components/ui/DocsLink';
import { ConditionEditor } from '@/components/builder/logic/ConditionEditor';
import { conditionCandidates } from '@/components/builder/logic/conditionOptions';
import { PropertySection } from './PropertySection';
import type { SectionProps } from './types';

export function LogicSection({ field, set, allFields }: SectionProps & { allFields: FormField[] }) {
  if (field.type === 'pageBreak') {
    const index = allFields.findIndex((f) => f.id === field.id);
    const candidates = index > 0 ? conditionCandidates(allFields.slice(0, index)) : [];
    return (
      <PropertySection
        title="Step logic"
        description="Decide whether the step after this break is shown."
        aside={<DocsLink path={DOCS.stepLogic} label="Guide" />}
      >
        <ConditionEditor
          value={field.showIf}
          candidates={candidates}
          onChange={(showIf) => set({ showIf })}
          emptyText="Always shown. Add a condition to skip this step unless earlier answers match."
          addLabel="Add step condition"
        />
      </PropertySection>
    );
  }

  return (
    <PropertySection
      title="Logic"
      description="Show this only when other answers match. Hidden fields are never required."
      aside={<DocsLink path={DOCS.fieldLogic} label="Guide" />}
    >
      <ConditionEditor
        value={field.showIf}
        candidates={conditionCandidates(allFields, field.id)}
        onChange={(showIf) => set({ showIf })}
        emptyText="Always shown."
      />
    </PropertySection>
  );
}
