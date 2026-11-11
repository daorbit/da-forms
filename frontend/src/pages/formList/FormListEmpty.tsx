import { FileTextIcon, InboxIcon, LayoutTemplateIcon, LinkIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeatureStart } from '@/components/ui/start/FeatureStart';
import { ColumnsPreview, FormPreview, ListPreview } from '@/components/ui/start/StartPreviews';

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
    <FeatureStart
      id="forms-empty"
      icon={FileTextIcon}
      title="Build your first form"
      text={
        canCreate
          ? 'Collect leads, bookings and payments with a form you can share as a link or embed on your site.'
          : 'Nobody has built a form in this workspace yet. An editor can create one.'
      }
      action={canCreate ? { label: 'Create your first form', onClick: onCreate, icon: PlusIcon } : undefined}
      note={canCreate ? 'Start from a template, describe it to Orbit, or build it from scratch.' : undefined}
      cardsTitle="How it works"
      cards={[
        {
          icon: LayoutTemplateIcon,
          title: 'Build',
          text: 'Drag in fields, add a booking or payment step, and match your brand.',
          preview: <FormPreview />,
        },
        {
          icon: LinkIcon,
          title: 'Share',
          text: 'Send the link, show a QR code or embed it on any page of your site.',
          preview: (
            <ListPreview
              rows={[
                { label: 'Link', width: 'most' },
                { label: 'QR code', width: 'half' },
                { label: 'Embed', width: 'third' },
              ]}
            />
          ),
        },
        {
          icon: InboxIcon,
          title: 'Collect',
          text: 'Responses land in Entries with their source, and you get an alert for each one.',
          preview: <ColumnsPreview />,
        },
      ]}
    />
  );
}
