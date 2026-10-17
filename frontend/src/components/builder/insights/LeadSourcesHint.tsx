import { DOCS } from '@/lib/docs';
import { DocsLink } from '@/components/ui/DocsLink';

export function LeadSourcesHint() {
  return (
    <>
      Sources come from UTM tags, ad clicks and the site people arrived from. Mark a lead as Won in its pipeline to
      count it here. Forms embedded on your site need the latest embed code. <DocsLink path={DOCS.leadSources} label="How tracking works" />
    </>
  );
}
