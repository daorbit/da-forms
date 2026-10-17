import { useMemo, useState } from 'react';
import type { FormTemplate, TemplateCategory } from '@/lib/templates';
import { filterTemplates } from '@/lib/templates/search';

export function useTemplateFilters(templates: FormTemplate[]) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');

  const results = useMemo(() => filterTemplates(templates, query, category), [templates, query, category]);

  const reset = () => {
    setQuery('');
    setCategory('All');
  };

  return { query, setQuery, category, setCategory, results, reset };
}
