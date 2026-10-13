import { useMemo, useState } from 'react';
import type { FormTemplate, TemplateCategory } from '@/lib/templates';
import { filterTemplates, type ScopeFilter } from '@/lib/templates/search';

export function useTemplateFilters(templates: FormTemplate[], initialScope: ScopeFilter = 'all') {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'All'>('All');
  const [scope, setScope] = useState<ScopeFilter>(initialScope);

  const results = useMemo(() => filterTemplates(templates, query, category, scope), [templates, query, category, scope]);

  const reset = () => {
    setQuery('');
    setCategory('All');
    setScope('all');
  };

  return { query, setQuery, category, setCategory, scope, setScope, results, reset };
}
