export const DOCS_BASE = 'https://quantalog.daorbit.in/docs';

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
  scoring: '/forms-settings-and-analytics#quizzes',
} as const;

export function docsUrl(path: string): string {
  return `${DOCS_BASE}${path}`;
}
