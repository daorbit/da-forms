export const DOCS_BASE = 'https://quantalog.daorbit.in/docs';
export const GOOGLE_DATA_POLICY_URL = 'https://quantalog.daorbit.in/privacy#google-user-data';

export const DOCS = {
  forms: '/lead-capture',
  fieldLogic: '/forms-logic#show-fields',
  stepLogic: '/forms-logic#skip-steps',
  oneQuestion: '/lead-capture#one-question',
  endings: '/forms-logic#endings',
  routing: '/forms-logic#routing',
  notifications: '/forms-notifications-and-apps',
  pipeline: '/forms-entries-and-links#pipeline',
  quickSettings: '/forms-settings-and-analytics#quick-settings',
  switchTemplate: '/forms-settings-and-analytics#switch-template',
  scoring: '/forms-settings-and-analytics#quizzes',
  booking: '/forms-booking',
  bookingGoogleAccess: '/forms-booking#google-access',
} as const;

export function docsUrl(path: string): string {
  return `${DOCS_BASE}${path}`;
}
