import type { RequestHandler } from 'express';
import * as formService from '../../services/form.service.js';
import * as bookingService from '../../services/booking.service.js';
import { MAX_RANGE_DAYS } from '../../lib/bookingSlots.js';
import { addDays, isDateKey } from '../../lib/zonedTime.js';
import { flattenFields } from '../../lib/pipe.js';

export const getBookingSlots: RequestHandler = async (req, res) => {
  const { from, to } = req.query;
  if (!isDateKey(from) || !isDateKey(to) || to < from || addDays(from, MAX_RANGE_DAYS) < to) {
    return res.status(400).json({ error: 'invalid_range', message: 'Ask for up to six weeks at a time.' });
  }

  const form = await formService.getForm(req.params.id);
  if (!form) {
    return res.status(404).json({ error: 'not_found', message: 'Form not found' });
  }

  const field = flattenFields(form.fields).find((f) => f.id === req.params.fieldId && f.type === 'booking');
  if (!field) return res.status(404).json({ error: 'not_found', message: 'Booking field not found' });

  res.set('Cache-Control', 'no-store');
  res.json(await bookingService.availableSlots(form, field, from, to));
};
