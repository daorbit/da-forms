import { Router } from 'express';
import * as formController from '../controllers/form.controller.js';

export const formRouter = Router();

formRouter.get('/', formController.listForms);
formRouter.post('/', formController.createForm);
formRouter.get('/:id', formController.getForm);
formRouter.patch('/:id', formController.updateForm);
formRouter.delete('/:id', formController.deleteForm);
formRouter.post('/:id/submissions', formController.submitForm);
formRouter.get('/:id/submissions', formController.listSubmissions);
