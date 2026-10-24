import { runAfterResponse } from '../lib/afterResponse.js';
import { alertServerResponse } from '../lib/opsAlert.js';
import { createServerErrorReporter } from './server-error-reporter.js';

export { markServerErrorReported } from './server-error-reporter.js';

const SELF_REPORTING_PREFIXES = ['/api/cron/'];

export const reportServerErrors = createServerErrorReporter((status, report) => {
  runAfterResponse('ops alert', () => alertServerResponse(status, report));
}, SELF_REPORTING_PREFIXES);
