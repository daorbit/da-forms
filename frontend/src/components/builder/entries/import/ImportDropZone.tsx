import { useRef, useState } from 'react';
import { Button, Loader } from '@mantine/core';
import { FileSpreadsheetIcon } from 'lucide-react';
import { MAX_IMPORT_ROWS } from '@/lib/leadImport/importColumns';
import classes from './ImportLeadsModal.module.css';

interface Props {
  parsing: boolean;
  onPick: (file: File | null) => void;
}

export function ImportDropZone({ parsing, onPick }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      className={classes.drop}
      data-over={over || undefined}
      data-busy={parsing || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!parsing) onPick(e.dataTransfer.files?.[0] ?? null);
      }}
    >
      <span className={classes.dropIcon}>
        {parsing ? <Loader size={20} /> : <FileSpreadsheetIcon size={22} strokeWidth={1.75} />}
      </span>
      <span className={classes.dropTitle}>{parsing ? 'Reading your file…' : 'Drag your Excel file here'}</span>
      <span className={classes.dropText}>.xlsx file · up to {MAX_IMPORT_ROWS.toLocaleString()} leads</span>
      <Button
        variant="default"
        radius="xl"
        size="sm"
        mt={14}
        disabled={parsing}
        onClick={() => input.current?.click()}
      >
        Choose file
      </Button>
      <input
        ref={input}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(e) => {
          onPick(e.currentTarget.files?.[0] ?? null);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}
