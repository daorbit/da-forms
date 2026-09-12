import { Router, type ErrorRequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import * as formController from '../controllers/form.controller.js';
import * as settingsController from '../controllers/settings.controller.js';
import * as appController from '../controllers/appConnection.controller.js';
import { uploadFormFile, uploadBackgroundImage } from '../controllers/upload.controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { blockDemoWorkspaceWrites } from '../middleware/demo-workspace.js';
import { requireWorkspaceToken } from '../middleware/require-workspace-token.js';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const uploadErrors: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'file_too_large',
        message: `Files must be under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB`,
      });
    }
    return res.status(400).json({ error: 'upload_rejected', message: err.message });
  }
  return next(err);
};

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many uploads — try again in a minute.' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many submissions — try again in a minute.' },
});

export const workspaceFormRouter = Router({ mergeParams: true });

workspaceFormRouter.use(blockDemoWorkspaceWrites);

workspaceFormRouter.use(requireWorkspaceToken);

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 6,
  standardHeaders: true,
});

workspaceFormRouter.post(
  '/generate',
  generateLimiter,
  asyncHandler(formController.generateForm)
);

workspaceFormRouter.get('/', asyncHandler(formController.listForms));
workspaceFormRouter.post('/', asyncHandler(formController.createForm));
workspaceFormRouter.get('/:id', asyncHandler(formController.getForm));
workspaceFormRouter.patch('/:id', asyncHandler(formController.updateForm));
workspaceFormRouter.post('/:id/duplicate', asyncHandler(formController.duplicateForm));
workspaceFormRouter.delete('/:id', asyncHandler(formController.deleteForm));
workspaceFormRouter.get('/:id/submissions', asyncHandler(formController.listSubmissions));
workspaceFormRouter.patch('/:id/submissions/:subId', asyncHandler(formController.updateSubmission));
workspaceFormRouter.post('/:id/submissions/bulk-update', asyncHandler(formController.bulkUpdateSubmissions));
workspaceFormRouter.delete('/:id/submissions/:subId', asyncHandler(formController.deleteSubmission));

workspaceFormRouter.post('/:id/submissions/bulk-delete', asyncHandler(formController.bulkDeleteSubmissions));
workspaceFormRouter.get('/:id/analytics', asyncHandler(formController.getAnalytics));
workspaceFormRouter.get('/:id/files', asyncHandler(formController.listUploadedFiles));

workspaceFormRouter.post(
  '/backgrounds',
  uploadLimiter,
  upload.single('file'),
  uploadErrors,
  asyncHandler(uploadBackgroundImage)
);

export const workspaceSettingsRouter = Router({ mergeParams: true });

workspaceSettingsRouter.use(blockDemoWorkspaceWrites);

workspaceSettingsRouter.use(requireWorkspaceToken);

const paymentTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many attempts — try again in a minute.' },
});

workspaceSettingsRouter.get('/payments', asyncHandler(settingsController.getPaymentSettings));
workspaceSettingsRouter.put('/payments', asyncHandler(settingsController.savePaymentSettings));
workspaceSettingsRouter.post(
  '/payments/test',
  paymentTestLimiter,
  asyncHandler(settingsController.testPaymentConnection)
);
workspaceSettingsRouter.delete('/payments', asyncHandler(settingsController.disconnectPayments));

const appTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many attempts — try again in a minute.' },
});

workspaceSettingsRouter.get('/apps', asyncHandler(appController.listApps));
workspaceSettingsRouter.get('/apps/:appId', asyncHandler(appController.getApp));
workspaceSettingsRouter.put('/apps/:appId', asyncHandler(appController.saveApp));
workspaceSettingsRouter.post(
  '/apps/:appId/test',
  appTestLimiter,
  asyncHandler(appController.testApp)
);
workspaceSettingsRouter.delete('/apps/:appId', asyncHandler(appController.disconnectApp));

workspaceSettingsRouter.get('/webhook-app', asyncHandler(settingsController.getWebhookApp));
workspaceSettingsRouter.put('/webhook-app', asyncHandler(settingsController.saveWebhookApp));

export const publicFormRouter = Router();

publicFormRouter.get('/:id', asyncHandler(formController.getPublicForm));
publicFormRouter.post('/:id/submissions', submitLimiter, asyncHandler(formController.submitForm));
publicFormRouter.post(
  '/:id/upload',
  uploadLimiter,
  upload.single('file'),

  uploadErrors,
  asyncHandler(uploadFormFile)
);

const partialLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many draft saves.' },
});

publicFormRouter.put('/:id/partial', partialLimiter, asyncHandler(formController.savePartial));

publicFormRouter.post('/:id/resume', submitLimiter, asyncHandler(formController.emailResumeLink));
publicFormRouter.get('/:id/resume', submitLimiter, asyncHandler(formController.getPartialForResume));
publicFormRouter.get('/:id/edit', submitLimiter, asyncHandler(formController.getSubmissionForEdit));
publicFormRouter.put('/:id/edit', submitLimiter, asyncHandler(formController.updateSubmissionByToken));
publicFormRouter.post('/:id/view', asyncHandler(formController.recordView));
publicFormRouter.get('/:id/payments/:orderId', asyncHandler(formController.getPaymentStatus));

export const publicPaymentRouter = Router();

publicPaymentRouter.post(
  '/:workspaceId/payments/webhook',
  asyncHandler(formController.razorpayWebhook)
);

publicPaymentRouter.post(
  '/:workspaceId/payments/webhook/razorpay',
  asyncHandler(formController.razorpayWebhook)
);

publicPaymentRouter.post(
  '/:workspaceId/payments/webhook/cashfree',
  asyncHandler(formController.cashfreeWebhook)
);

publicPaymentRouter.post(
  '/:workspaceId/payments/webhook/payu',
  asyncHandler(formController.payuWebhook)
);

publicPaymentRouter.post(
  '/:workspaceId/payments/return/payu',
  asyncHandler(formController.payuReturn)
);

publicPaymentRouter.get(
  '/:workspaceId/payments/return/payu',
  asyncHandler(formController.payuReturn)
);
