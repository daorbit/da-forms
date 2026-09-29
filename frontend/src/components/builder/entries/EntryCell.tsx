import { Anchor, Button, Group, Image, Stack, Text } from '@mantine/core';
import type { FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { parseRepeaterRows } from '@/lib/repeater';
import { PaymentCell } from '@/components/builder/PaymentCell';
import { FileTypeIcon } from './fileTypeIcon';
import { FileSizeBadge } from './FileSizeBadge';
import { answerText, formatAnswer, isImageUrl } from './entriesTypes';
import classes from './EntriesTable.module.css';

interface Props {
  field: FormField;
  submission: Submission;
  onView: (submission: Submission) => void;
  onOpenAttachment: (attachment: { url: string; name: string; image: boolean }) => void;
}

export function EntryCell({ field, submission, onView, onOpenAttachment }: Props) {
  if (field.type === 'payment') return <PaymentCell payment={submission.payment} />;

  if (field.type === 'repeater') {
    const rowCount = parseRepeaterRows(submission.data[field.id]).length;
    if (rowCount === 0) return <span className={classes.empty}>—</span>;
    return (
      <Button
        variant="subtle"
        size="compact-xs"
        color="gray"
        onClick={(e) => {
          e.stopPropagation();
          onView(submission);
        }}
      >
        {rowCount} {rowCount === 1 ? 'entry' : 'entries'}
      </Button>
    );
  }

  const raw = answerText(submission.data[field.id]);
  if (!raw) return <span className={classes.empty}>—</span>;

  const isFileLink = uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw);
  const isImage = isFileLink && (field.type === 'imageUpload' || field.type === 'signature' || isImageUrl(raw));
  const fileName = raw.split('/').pop() || 'Attachment';
  const bytes = submission.fileMeta?.[field.id]?.bytes;

  if (isImage) {
    return (
      <Group gap={6} wrap="nowrap">
        <Anchor href={raw} target="_blank" rel="noopener noreferrer">
          <Image
            src={raw}
            alt={fileName}
            h={36}
            w={36}
            fit="cover"
            radius="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenAttachment({ url: raw, name: fileName, image: true });
            }}
          />
        </Anchor>
        <FileSizeBadge bytes={bytes} url={raw} />
      </Group>
    );
  }

  if (isFileLink) {
    return (
      <Anchor
        href={raw}
        target="_blank"
        rel="noopener noreferrer"
        underline="never"
        c="inherit"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenAttachment({ url: raw, name: fileName, image: false });
        }}
      >
        <Group gap={6} wrap="nowrap">
          <FileTypeIcon fileName={fileName} size={24} previewable />
          <Stack gap={0} miw={0}>
            <Text size="sm" truncate maw={140}>
              {fileName}
            </Text>
            <FileSizeBadge bytes={bytes} url={raw} />
          </Stack>
        </Group>
      </Anchor>
    );
  }

  return (
    <span className={classes.cellText} title={raw}>
      {formatAnswer(field.type, raw)}
    </span>
  );
}
