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
import { featuredTemplates } from './featured';
import { proBusinessTemplates } from './pro/business';
import { proPeopleTemplates } from './pro/people';
import { proServicesTemplates } from './pro/services';
import { modernize } from './modernize';

export type { FormTemplate, TemplateCategory } from './types';
export { templateCategories } from './types';

export const formTemplates = [
  ...featuredTemplates,
  ...proBusinessTemplates,
  ...proPeopleTemplates,
  ...proServicesTemplates,
  ...modernize([
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
  ]),
];
