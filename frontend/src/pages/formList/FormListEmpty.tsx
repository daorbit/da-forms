import { FileTextIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

interface Props {
  filtered: boolean;
  canCreate: boolean;
  onClearFilters: () => void;
  onCreate: () => void;
}

export function FormListEmpty({ filtered, canCreate, onClearFilters, onCreate }: Props) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="No forms match"
        description="Try a different search or status."
        action={{ label: 'Clear filters', onClick: onClearFilters, variant: 'default' }}
      />
    );
  }

  return (
    <EmptyState
      icon={FileTextIcon}
      title="No forms yet"
      description="Build a form to collect leads, then share its link or embed it on your site."
      action={canCreate ? { label: 'Create your first form', onClick: onCreate, icon: PlusIcon } : undefined}
    />
  );
}
