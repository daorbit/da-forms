import { ArrowRightIcon, MegaphoneIcon, TagIcon, TrophyIcon, WaypointsIcon } from 'lucide-react';
import { FeatureStart } from '@/components/ui/start/FeatureStart';
import { ListPreview, StagesPreview } from '@/components/ui/start/StartPreviews';
import { useGoToForms } from '@/hooks/useGoToForms';

export function SourcesEmpty() {
  const goToForms = useGoToForms();
  return (
    <FeatureStart
      id="sources-empty"
      icon={MegaphoneIcon}
      title="Find out which marketing brings leads"
      text="Share a form with UTM tags on its links. Every lead is traced back to the channel and campaign it came from, and whether you won it."
      action={{ label: 'Go to forms', onClick: goToForms, icon: ArrowRightIcon }}
      note="Each form's Share menu builds tagged links for you."
      cards={[
        {
          icon: WaypointsIcon,
          title: 'Sources',
          text: 'Google, Instagram, newsletters or direct visits, ranked by leads.',
          preview: (
            <ListPreview
              rows={[
                { label: 'google', width: 'full' },
                { label: 'instagram', width: 'most' },
                { label: 'newsletter', width: 'half' },
                { label: 'direct', width: 'third' },
              ]}
            />
          ),
        },
        {
          icon: TagIcon,
          title: 'Campaigns',
          text: 'Each utm_campaign on its own row, so you can compare launches and ads.',
          preview: (
            <ListPreview
              rows={[
                { label: 'spring-sale', width: 'most' },
                { label: 'webinar', width: 'half' },
                { label: 'retarget', width: 'third' },
              ]}
            />
          ),
        },
        {
          icon: TrophyIcon,
          title: 'Leads you won',
          text: 'Mark leads in their pipeline and see which source brings the ones that close.',
          preview: <StagesPreview />,
        },
      ]}
    />
  );
}
