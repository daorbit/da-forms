import { ArrowRightIcon, CalendarCheckIcon, CalendarDaysIcon, ClipboardListIcon, VideoIcon } from 'lucide-react';
import { FeatureStart } from '@/components/ui/start/FeatureStart';
import { FormPreview, HeatmapPreview, ListPreview } from '@/components/ui/start/StartPreviews';
import { useGoToForms } from '@/hooks/useGoToForms';

export function BookingsEmpty() {
  const goToForms = useGoToForms();
  return (
    <FeatureStart
      id="bookings-empty"
      icon={CalendarCheckIcon}
      title="Take bookings with any form"
      text="Add a booking field to a form and people pick a time while they fill it in. Every meeting lands on this calendar."
      action={{ label: 'Go to forms', onClick: goToForms, icon: ArrowRightIcon }}
      note="Set your weekly hours, buffers and days off on the booking field."
      cards={[
        {
          icon: ClipboardListIcon,
          title: 'A booking step',
          text: 'Visitors see only your free slots and choose one as part of the form.',
          preview: <FormPreview />,
        },
        {
          icon: VideoIcon,
          title: 'Meet link included',
          text: 'Connect Google Calendar and each booking gets an event with a Google Meet link.',
          preview: (
            <ListPreview
              rows={[
                { label: 'Calendar', width: 'full' },
                { label: 'Meet link', width: 'most' },
                { label: 'Invite', width: 'half' },
              ]}
            />
          ),
        },
        {
          icon: CalendarDaysIcon,
          title: 'One calendar',
          text: 'Every booking from every form, by month or week, with who is coming next.',
          preview: <HeatmapPreview />,
        },
      ]}
    />
  );
}
