import { ArrowRightIcon, ChartColumnIcon, ChartNoAxesColumnIcon, ClockIcon, FilterIcon } from 'lucide-react';
import { FeatureStart } from '@/components/ui/start/FeatureStart';
import { ColumnsPreview, FunnelPreview, HeatmapPreview } from '@/components/ui/start/StartPreviews';
import { useGoToForms } from '@/hooks/useGoToForms';

export function InsightsEmpty() {
  const goToForms = useGoToForms();
  return (
    <FeatureStart
      id="insights-empty"
      icon={ChartNoAxesColumnIcon}
      title="See how every form performs"
      text="Create and share a form. Its views, responses and completion rate show up here as they arrive, compared with the period before."
      action={{ label: 'Go to forms', onClick: goToForms, icon: ArrowRightIcon }}
      note="Numbers update on their own. Nothing to install."
      cards={[
        {
          icon: ChartColumnIcon,
          title: 'Views and responses',
          text: 'Daily trends for every form, with the change against the previous period.',
          preview: <ColumnsPreview />,
        },
        {
          icon: FilterIcon,
          title: 'Completion and drop-off',
          text: 'How many people start, how many finish, and the question where they leave.',
          preview: <FunnelPreview />,
        },
        {
          icon: ClockIcon,
          title: 'Best times',
          text: 'The days and hours responses come in, so you know when to share.',
          preview: <HeatmapPreview />,
        },
      ]}
    />
  );
}
