import { DOCS } from '@/lib/docs';
import { DocsLink } from '@/components/ui/DocsLink';
import classes from './LeadSourcesCard.module.css';

export function LeadSourcesHint({ legacyEmbeds = 0 }: { legacyEmbeds?: number }) {
  return (
    <>
      {legacyEmbeds > 0 && (
        <p className={classes.warning}>
          {legacyEmbeds.toLocaleString()} {legacyEmbeds === 1 ? 'response' : 'responses'} in the last 30 days came
          from an old embed code, so only the website is known. Copy the code again from Share → Embed to track the
          full source.
        </p>
      )}
      Sources come from UTM tags, ad clicks and the site people arrived from. Mark a lead as Won in its pipeline to
      count it here. <DocsLink path={DOCS.leadSources} label="How tracking works" />
    </>
  );
}
