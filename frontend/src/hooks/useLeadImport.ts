import { useCallback, useMemo, useState } from 'react';
import type { Form } from '@/types';
import { importSubmissions } from '@/lib/api';
import { notify } from '@/lib/notify';
import { importColumns } from '@/lib/leadImport/importColumns';
import type { ParsedImport } from '@/lib/leadImport/leadWorkbook';

const CHUNK = 100;

export function useLeadImport(form: Form | null, workspaceId: string, onImported: () => void) {
  const columns = useMemo(() => (form ? importColumns(form.fields) : []), [form]);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [busy, setBusy] = useState<'template' | 'parsing' | 'importing' | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setFile(null);
    setParsed(null);
    setProgress(0);
  }, []);

  const download = useCallback(
    async (withSamples: boolean) => {
      if (!form) return;
      setBusy('template');
      try {
        const { downloadTemplate } = await import('@/lib/leadImport/leadWorkbook');
        await downloadTemplate(form.name || form.title, columns, withSamples);
      } catch {
        notify.error('Could not create the Excel file');
      } finally {
        setBusy(null);
      }
    },
    [form, columns],
  );

  const pick = useCallback(
    async (next: File | null) => {
      if (!next) return;
      if (!/\.xlsx$/i.test(next.name)) {
        notify.error('Upload an Excel file (.xlsx)');
        return;
      }
      setBusy('parsing');
      setFile(next);
      try {
        const { parseLeadFile } = await import('@/lib/leadImport/leadWorkbook');
        const result = await parseLeadFile(next, columns);
        if (!result.matched.length) {
          notify.error('No columns match this form. Start from the template.');
          reset();
          return;
        }
        if (!result.rows.length) {
          notify.error('The file has no leads to import');
          reset();
          return;
        }
        setParsed(result);
      } catch {
        notify.error('Could not read this file');
        reset();
      } finally {
        setBusy(null);
      }
    },
    [columns, reset],
  );

  const runImport = useCallback(
    async (asTest: boolean) => {
      if (!form || !parsed) return false;
      setBusy('importing');
      setProgress(0);
      const tags = asTest ? ['test'] : [];
      let imported = 0;
      let done = 0;
      try {
        for (; done < parsed.rows.length; done += CHUNK) {
          const res = await importSubmissions(form._id, parsed.rows.slice(done, done + CHUNK), tags, workspaceId);
          imported += res.imported;
          setProgress(Math.min(parsed.rows.length, done + CHUNK));
        }
        notify.success(`${imported} ${imported === 1 ? 'lead' : 'leads'} imported`);
        onImported();
        reset();
        return true;
      } catch {
        if (done > 0) {
          setParsed({ ...parsed, rows: parsed.rows.slice(done) });
          onImported();
          notify.error(`Imported ${imported} leads, then stopped. Import again to add the remaining rows.`);
        } else {
          notify.error('Import failed');
        }
        return false;
      } finally {
        setBusy(null);
      }
    },
    [form, parsed, workspaceId, onImported, reset],
  );

  return { columns, file, parsed, busy, progress, download, pick, runImport, reset };
}
