import { basicTemplates } from './basic';
import { supportTemplates } from './support';
import { businessTemplates } from './business';
import { commerceTemplates } from './commerce';

export type { FormTemplate } from './types';

/**
 * Every starting point offered in the new-form modal, in the order they
 * are shown: the simplest forms first, the long multi-step ones last.
 */
export const formTemplates = [
  ...basicTemplates,
  ...supportTemplates,
  ...commerceTemplates,
  ...businessTemplates,
];
