import { Image, Stack, Table } from '@mantine/core';
import type { Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { repeaterDisplayRows } from '@/lib/repeater';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { FileTypeIcon } from '../fileTypeIcon';
import { FileSizeBadge } from '../FileSizeBadge';
import { answerText, formatAnswer, isImageUrl } from '../entriesTypes';
import type { ResponseColumn } from './types';
import classes from './AnswerList.module.css';

export type Attachment = { url: string; name: string; image: boolean };

interface Props {
  field: ResponseColumn;
  submission: Submission;
  onOpenAttachment: (attachment: Attachment) => void;
}

export function copyableAnswer(field: ResponseColumn, submission: Submission): string | null {
  if (field.type === 'payment' || field.type === 'repeater') return null;
  const raw = answerText(submission.data[field.id]);
  if (!raw || /^data:/.test(raw)) return null;
  return formatAnswer(field.type, raw);
}

export function hasAnswer(field: ResponseColumn, submission: Submission): boolean {
  if (field.type === 'payment') return Boolean(submission.payment);
  return Boolean(answerText(submission.data[field.id]).trim());
}

export function AnswerValue({ field, submission, onOpenAttachment }: Props) {
  if (field.type === 'payment') return <PaymentCell payment={submission.payment} />;

  const raw = answerText(submission.data[field.id]);

  if (field.type === 'repeater') {
    const rows = repeaterDisplayRows(field, raw);
    const subFields = field.subFields ?? [];
    return (
      <div className={classes.repeater}>
        <Table striped withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className={classes.repeaterIndex}>#</Table.Th>
              {subFields.map((sf) => (
                <Table.Th key={sf.id}>{sf.label}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={i}>
                <Table.Td className={classes.repeaterIndex}>{i + 1}</Table.Td>
                {row.cells.map((cell, j) => (
                  <Table.Td key={j}>{cell.value || '—'}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    );
  }

  const isFileLink = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);
  const isImage = isFileLink && (field.type === 'imageUpload' || field.type === 'signature' || isImageUrl(raw));
  const fileName = decodeURIComponent(raw.split('/').pop() || 'Attachment');
  const bytes = submission.fileMeta?.[field.id]?.bytes;

  if (isImage) {
    return (
      <Stack gap={6} align="flex-start">
        <a
          href={raw}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.image}
          onClick={(e) => {
            e.preventDefault();
            onOpenAttachment({ url: raw, name: fileName, image: true });
          }}
        >
          <Image src={raw} alt={fileName} mah={220} w="auto" fit="contain" />
        </a>
        <FileSizeBadge bytes={bytes} url={raw} />
      </Stack>
    );
  }

  if (isFileLink) {
    return (
      <a
        href={raw}
        target="_blank"
        rel="noopener noreferrer"
        className={classes.file}
        onClick={(e) => {
          e.preventDefault();
          onOpenAttachment({ url: raw, name: fileName, image: false });
        }}
      >
        <FileTypeIcon fileName={fileName} size={28} previewable />
        <Stack gap={0} miw={0}>
          <span className={classes.fileName}>{fileName}</span>
          <FileSizeBadge bytes={bytes} url={raw} />
        </Stack>
      </a>
    );
  }

  return <div className={classes.value}>{formatAnswer(field.type, raw)}</div>;
}
