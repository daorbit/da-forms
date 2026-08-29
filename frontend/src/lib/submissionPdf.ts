import { jsPDF } from 'jspdf';
import type { FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { paymentCellText } from '@/lib/payment';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** One response, laid out as a label/value sheet — mirrors the Entries detail view. */
export function downloadSubmissionPdf(formTitle: string, columns: FormField[], submission: Submission) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  let y = 56;

  function ensureSpace(nextLineHeight: number) {
    if (y + nextLineHeight > pageHeight - 48) {
      doc.addPage();
      y = 56;
    }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formTitle || 'Untitled form', marginX, y);
  y += 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Submitted ${formatDateTime(submission.createdAt)}`, marginX, y);
  doc.setTextColor(0);
  y += 28;

  for (const field of columns) {
    // A payment column has no answer in `data` — its value lives on the
    // submission, written by the webhook once Razorpay confirmed it.
    const raw =
      field.type === 'payment'
        ? paymentCellText(submission.payment)
        : (submission.data[field.id] ?? '');
    const isFile = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);

    ensureSpace(34);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120);
    doc.text(field.label.toUpperCase(), marginX, y);
    doc.setTextColor(0);
    y += 14;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const text = isFile ? raw : raw || '—';
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines as string[]) {
      ensureSpace(16);
      doc.text(line, marginX, y);
      y += 16;
    }
    y += 8;
  }

  doc.save(`${formTitle || 'response'}-${submission._id}.pdf`);
}
