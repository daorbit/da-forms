import type { FormField, FieldType, FormStep, StepIndicator } from '@/types';
import { flattenFields } from '@/lib/fieldTree';

const NOT_A_QUESTION = new Set<FieldType>([
  'heading',
  'description',
  'richText',
  'divider',
  'spacer',
  'pageBreak',
  'hidden',
  'uniqueId',
  'randomId',
  'calculated',
]);

const AUTO_ADVANCE = new Set<FieldType>(['radio', 'yesNo', 'rating', 'nps']);

export function asksQuestion(field: FormField): boolean {
  if (field.type === 'grid') return flattenFields(field.columns?.flat() ?? []).some(asksQuestion);
  return !NOT_A_QUESTION.has(field.type);
}

export function advancesOnAnswer(field: FormField): boolean {
  return AUTO_ADVANCE.has(field.type);
}

export interface QuestionLayout {
  pages: FormField[][];
  sections: number[];
}

export function splitIntoQuestions(fields: FormField[]): QuestionLayout {
  const pages: FormField[][] = [];
  const sections: number[] = [];
  let pending: FormField[] = [];
  let section = 0;

  for (const field of fields) {
    if (field.type === 'pageBreak') {
      section += 1;
      continue;
    }
    pending.push(field);
    if (asksQuestion(field)) {
      pages.push(pending);
      sections.push(section);
      pending = [];
    }
  }

  if (pending.length) {
    if (pages.length) pages[pages.length - 1].push(...pending);
    else {
      pages.push(pending);
      sections.push(section);
    }
  }

  return { pages, sections };
}

export function questionSteps(pages: FormField[][]): Required<FormStep>[] {
  return pages.map((page, index) => ({
    title: flattenFields(page).find(asksQuestion)?.label?.trim() || `Question ${index + 1}`,
    description: '',
  }));
}

export function questionIndicator(indicator: StepIndicator | undefined, oneQuestion: boolean): StepIndicator {
  if (!oneQuestion) return indicator ?? 'progress';
  return indicator === 'none' || indicator === 'counter' ? indicator : 'progress';
}

export function activeQuestionIndexes(
  layout: QuestionLayout,
  activeSections: number[],
  shown: Set<string>
): number[] {
  const sections = new Set(activeSections);
  const active = layout.pages.flatMap((page, index) =>
    sections.has(layout.sections[index]) && page.some((f) => asksQuestion(f) && shown.has(f.id)) ? [index] : []
  );
  return active.length ? active : [0];
}
