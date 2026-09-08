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
import { operationsTemplates } from './operations';
import { advancedTemplates } from './advanced';
import { feedbackTemplates } from './feedback';

export type { FormTemplate, TemplateCategory } from './types';
export { templateCategories } from './types';

 
export const formTemplates = [
  ...basicTemplates,
  ...supportTemplates,
  ...commerceTemplates,
  ...businessTemplates,
  ...professionalTemplates,
  ...operationsTemplates,
  ...advancedTemplates,
  ...feedbackTemplates,
  ...educationTemplates,
  ...healthTemplates,
  ...hrTemplates,
  ...propertyTemplates,
  ...hospitalityTemplates,
  ...communityTemplates,
  ...embedTemplates,
];
