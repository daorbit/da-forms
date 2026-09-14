import type { FormField, FormTheme } from '@/types';

export type Scope = NonNullable<FormTheme['scope']>;

export interface Draft {
  title: string;
  formDescription?: string;
  submitLabel?: string;
  fields: FormField[];
  theme?: FormTheme;
}

export interface Turn {
  prompt: string;
  draft: Draft | null;
}

export type CreateMode = 'hero' | 'template' | 'import';

export interface DeckCard {
  key: string;
  art?: string;
  title: string;
  body: string;
  onClick: () => void;
  busy?: boolean;
}
