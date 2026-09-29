import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import { listForms } from '@/lib/api';
import { listDemoForms } from '@/lib/demoWorkspace';
import type { Form } from '@/types';
import { PAGE_SIZE, type SortOption, type StatusFilter } from './constants';

export function useFormList(workspaceId: string, isDemo: boolean) {
  const location = useLocation();
  const [forms, setForms] = useState<Form[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<SortOption>('date');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const query = {
      page,
      limit: PAGE_SIZE,
      q: debouncedSearch,
      sort,
      status: status === 'all' ? undefined : status,
    };

    if (isDemo) {
      const res = listDemoForms(query);
      setForms(res.items);
      setTotal(res.total);
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    return listForms(workspaceId, query)
      .then((res) => {
        setForms(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [isDemo, workspaceId, page, debouncedSearch, sort, status]);

  useEffect(() => {
    load();
  }, [location.key, load]);

  const setFilter = (patch: Partial<{ q: string; sort: SortOption; status: StatusFilter }>) => {
    if (patch.q !== undefined) setSearch(patch.q);
    if (patch.sort) setSort(patch.sort);
    if (patch.status) setStatus(patch.status);
    setPage(1);
  };

  const replaceForm = (updated: Form) =>
    setForms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));

  return {
    forms,
    setForms,
    replaceForm,
    total,
    page,
    setPage,
    search,
    sort,
    status,
    loading,
    load,
    setFilter,
    isFiltered: debouncedSearch !== '' || status !== 'all',
  };
}
