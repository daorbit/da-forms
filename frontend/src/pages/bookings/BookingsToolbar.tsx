import { Select } from '@mantine/core';
import { FileTextIcon } from 'lucide-react';
import { SearchField } from '@/components/ui/SearchField';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import analytics from '@/pages/formAnalytics/FormAnalytics.module.css';
import type { BookingStatusFilter } from './filterBookings';
import classes from './BookingsPage.module.css';

const ALL = 'all';

const STATUS: { value: BookingStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'In progress' },
  { value: 'past', label: 'Completed' },
];

export function BookingsToolbar({
  query,
  onQuery,
  formId,
  onForm,
  status,
  onStatus,
  forms,
}: {
  query: string;
  onQuery: (q: string) => void;
  formId: string | null;
  onForm: (id: string | null) => void;
  status: BookingStatusFilter;
  onStatus: (status: BookingStatusFilter) => void;
  forms: { id: string; title: string }[];
}) {
  const options = [
    { value: ALL, label: 'All forms' },
    ...forms.map((f) => ({ value: f.id, label: f.title || 'Untitled form' })),
  ];

  return (
    <div className={`${analytics.toolbar} ${classes.toolbar}`}>
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder="Search by name, email or form"
        ariaLabel="Search bookings"
        className={classes.search}
      />
      <Select
        className={analytics.formSelect}
        classNames={{ input: analytics.formSelectInput, section: analytics.formSelectIcon }}
        aria-label="Form"
        data={options}
        value={formId ?? ALL}
        onChange={(v) => onForm(!v || v === ALL ? null : v)}
        allowDeselect={false}
        searchable
        leftSection={<FileTextIcon size={14} />}
        comboboxProps={{ radius: 'md' }}
      />
      <SegmentedTabs ariaLabel="Booking status" value={status} onChange={onStatus} data={STATUS} />
    </div>
  );
}
