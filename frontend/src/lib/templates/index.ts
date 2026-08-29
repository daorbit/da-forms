import { basicTemplates } from './basic';
import { supportTemplates } from './support';
import { businessTemplates } from './business';
import { commerceTemplates } from './commerce';
import { educationTemplates } from './education';
import { healthTemplates } from './health';
import { hrTemplates } from './hr';
import { propertyTemplates } from './property';
import { hospitalityTemplates } from './hospitality';
import { communityTemplates } from './community';
import { embedTemplates } from './embed';
import { professionalTemplates } from './professional';

export type { FormTemplate, TemplateCategory } from './types';
export { templateCategories } from './types';

/**
 * Every starting point offered in the new-form modal, in the order they are
 * shown: the simplest forms first, the longer specialised ones after.
 */
export const formTemplates = [
  ...basicTemplates,
  ...supportTemplates,
  ...commerceTemplates,
  ...businessTemplates,
  ...professionalTemplates,
  ...educationTemplates,
  ...healthTemplates,
  ...hrTemplates,
  ...propertyTemplates,
  ...hospitalityTemplates,
  ...communityTemplates,
  ...embedTemplates,
];
