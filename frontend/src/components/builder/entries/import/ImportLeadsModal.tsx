import { useEffect, useState } from 'react';
import { Button, Modal, Progress } from '@mantine/core';
import type { Form } from '@/types';
import { useLeadImport } from '@/hooks/useLeadImport';
import { ImportTemplateStep } from './ImportTemplateStep';
import { ImportDropZone } from './ImportDropZone';
import { ImportPreview } from './ImportPreview';
import classes from './ImportLeadsModal.module.css';

interface Props {
  opened: boolean;
  form: Form | null;
  workspaceId: string;
  onClose: () => void;
  onImported: () => void;
}

export function ImportLeadsModal({ opened, form, workspaceId, onClose, onImported }: Props) {
  const lead = useLeadImport(form, workspaceId, onImported);
  const [asTest, setAsTest] = useState(false);
  const importing = lead.busy === 'importing';
  const total = lead.parsed?.rows.length ?? 0;

  useEffect(() => {
    if (lead.file) setAsTest(/sample|test|dummy/i.test(lead.file.name));
  }, [lead.file]);

  const close = () => {
    if (importing) return;
    lead.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      size={640}
      centered
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 2 }}
      classNames={{ header: classes.header, body: classes.body }}
      title={
        <span className={classes.titleWrap}>
          <span className={classes.title}>Import leads</span>
          <span className={classes.subtitle}>Add leads from an Excel file as responses to this form.</span>
        </span>
      }
    >
      {lead.parsed && lead.file ? (
        <>
          <ImportPreview
            fileName={lead.file.name}
            columns={lead.columns}
            parsed={lead.parsed}
            asTest={asTest}
            disabled={importing}
            onAsTestChange={setAsTest}
          />

          <div className={classes.footer}>
            {importing ? (
              <div className={classes.progress}>
                <Progress value={total ? (lead.progress / total) * 100 : 0} size={6} radius="xl" />
                <span className={classes.progressText}>
                  {lead.progress.toLocaleString()} / {total.toLocaleString()}
                </span>
              </div>
            ) : (
              <Button variant="subtle" color="gray" radius="xl" onClick={lead.reset}>
                Choose another file
              </Button>
            )}
            <Button
              radius="xl"
              loading={importing}
              onClick={async () => {
                if (await lead.runImport(asTest)) onClose();
              }}
            >
              Import {total.toLocaleString()} {total === 1 ? 'lead' : 'leads'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <ImportDropZone parsing={lead.busy === 'parsing'} onPick={lead.pick} />
          <ImportTemplateStep columns={lead.columns} busy={lead.busy === 'template'} onDownload={lead.download} />
        </>
      )}
    </Modal>
  );
}
