import { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeDark,
  colorSchemeLight,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community';
import { Button, Group, Stack, Text, ThemeIcon, useComputedColorScheme } from '@mantine/core';
import { IconMailOpened, IconShare2 } from '@tabler/icons-react';
import type { Form, FormField, Submission } from '@/types';
import { uploadedTypes } from '@/lib/fieldPalette';
import { parseRepeaterRows } from '@/lib/repeater';
import { formatAnswer, formatDateTime } from './entriesTypes';
import classes from '../../../pages/EntriesPage.module.css';


ModuleRegistry.registerModules([AllCommunityModule]);

/** Columns that are not one of the form's own fields. */
const ROW_NUMBER_WIDTH = 64;

type Row = {
  __submission: Submission;
  __index: number;
  __added: string;
  __read: boolean;
  [fieldId: string]: unknown;
};

export function EntriesExcel({
  form,
  columns,
  submissions,
  loading,
  onView,
  onCopyShareLink,
}: {
  form: Form | null;
  columns: (FormField & { retired?: boolean })[];
  submissions: Submission[];
  loading: boolean;
  onView: (submission: Submission) => void;
  onCopyShareLink: () => void;
}) {
  const scheme = useComputedColorScheme('light');
  const gridRef = useRef<AgGridReact<Row>>(null);

  // Quartz is the closest of the built-in themes to a spreadsheet: square
  // cells, visible gridlines, a compact row height. The Theming API is used
  // rather than the legacy CSS import because v33+ warns on mixing the two.
  const theme = useMemo(
    () =>
      themeQuartz
        .withPart(scheme === 'dark' ? colorSchemeDark : colorSchemeLight)
        .withParams({
          spacing: 5,
          headerHeight: 32,
          rowHeight: 28,
          fontSize: 12,
          headerFontWeight: 600,
          borderColor: 'var(--mantine-color-default-border)',
          accentColor: 'var(--mantine-color-emerald-6)',
          backgroundColor: 'var(--mantine-color-body)',
        }),
    [scheme],
  );

  const rows = useMemo<Row[]>(
    () =>
      submissions.map((submission, i) => {
        const row: Row = {
          __submission: submission,
          __index: i + 1,
          __added: submission.createdAt,
          __read: submission.read,
        };

        for (const field of columns) {
          if (field.type === 'payment') {
            const payment = submission.payment;
            // Amounts are stored in minor units, so a paid row reads
            // "500.00 INR paid" rather than "50000".
            row[field.id] = payment
              ? `${(payment.amount / 100).toFixed(2)} ${payment.currency} ${payment.status}`
              : '';
            continue;
          }

          if (field.type === 'repeater') {
            const count = parseRepeaterRows(submission.data[field.id]).length;
            row[field.id] = count === 0 ? '' : `${count} ${count === 1 ? 'entry' : 'entries'}`;
            continue;
          }

          const raw = submission.data[field.id] ?? '';

          // A file cell holds a URL, which is unreadable at this density and
          // useless to copy in bulk. The filename is what someone scanning the
          // column is actually looking for.
          if (uploadedTypes.includes(field.type) && /^https?:\/\//.test(raw)) {
            row[field.id] = raw.split('/').pop() || 'Attachment';
            continue;
          }

          row[field.id] = formatAnswer(field.type, raw);
        }

        return row;
      }),
    [submissions, columns],
  );

  const colDefs = useMemo<ColDef<Row>[]>(() => {
    const fieldCols: ColDef<Row>[] = columns.map((field) => ({
      field: field.id,
      headerName: field.retired ? `${field.label} (removed)` : field.label,
      headerTooltip: field.retired
        ? `${field.label} — this field was removed from the form, but its earlier answers are kept`
        : field.label,
      tooltipField: field.id,
      minWidth: 120,
      // Numbers right-align, as they would in a spreadsheet, so a column of
      // them can be read down its last digit.
      type: field.type === 'number' ? 'rightAligned' : undefined,
      cellClass: field.retired ? 'ag-cell-retired' : undefined,
    }));

    return [
      {
        // The row-number gutter. Pinned and non-movable: it is the one column
        // that has to stay put for the others to be worth dragging around.
        headerName: '',
        field: '__index',
        width: ROW_NUMBER_WIDTH,
        minWidth: ROW_NUMBER_WIDTH,
        maxWidth: ROW_NUMBER_WIDTH,
        pinned: 'left',
        lockPosition: true,
        suppressMovable: true,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: 'ag-cell-rownum',
      },
      ...fieldCols,
      {
        field: '__added',
        headerName: 'Added Time',
        minWidth: 170,
        // Takes up whatever width the columns before it did not. Without this
        // the grid stops at its natural width and leaves a band of empty
        // background to the right of the last column, which reads as the table
        // having failed to load rather than as a table that is simply narrow.
        flex: 1,
        valueFormatter: (p) => (p.value ? formatDateTime(p.value as string) : ''),
      },
      {
        headerName: '',
        colId: '__open',
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        // The one action this view keeps. Everything else — delete, PDF, mark
        // read — is a per-response decision that belongs where a response is
        // being read one at a time, not in a grid built for scanning.
        cellRenderer: (p: ICellRendererParams<Row>) =>
          p.data ? (
            <Button
              variant="subtle"
              size="compact-xs"
              color="gray"
              onClick={() => onView(p.data!.__submission)}
            >
              Open
            </Button>
          ) : null,
      },
    ];
  }, [columns, onView]);

  const defaultColDef = useMemo<ColDef<Row>>(
    () => ({
      // Everything a spreadsheet column does, minus editing.
      sortable: true,
      resizable: true,
      filter: true,
      // Column drag-to-reorder is on by default; this only says the header
      // may also be dragged out to the side panel, which Community lacks.
      suppressHeaderMenuButton: false,
      width: 170,
    }),
    [],
  );

  // No `sizeColumnsToFit` here. The "Added Time" column carries `flex`, which
  // already absorbs any leftover width, and calling both makes them fight —
  // the fit pass sets explicit widths that the flex column then overrides on
  // the next resize, so columns jump on the first drag.

  if (!loading && submissions.length === 0) {
    return (
      <Stack align="center" gap={4} py="xl">
        <ThemeIcon variant="light" color="gray" size={44} radius="xl">
          <IconMailOpened size={22} />
        </ThemeIcon>
        <Text fw={600} size="sm">
          No responses yet
        </Text>
        <Text size="xs" c="dimmed" ta="center" maw={320}>
          Share your form&apos;s link to start collecting responses.
        </Text>
        <Button
          variant="light"
          color="emerald"
          size="xs"
          mt="xs"
          leftSection={<IconShare2 size={14} />}
          onClick={onCopyShareLink}
        >
          Copy share link
        </Button>
      </Stack>
    );
  }

  return (
    // One bordered card holding the grid and its footer, so the view reads as
    // a single object the way the list view's table does — rather than a grid
    // with a caption floating on the page background under it.
    <div className={classes.excelCard}>
      <div className={classes.excelGrid}>
        <AgGridReact<Row>
          ref={gridRef}
          theme={theme}
          rowData={rows}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          loading={loading}
          // Excel's own selection model: drag a range, Ctrl+C, paste it
          // somewhere real. This is the whole reason the view exists, so it is
          // on rather than left to a prop nobody sets.
          cellSelection
          suppressRowClickSelection
          rowClass="ag-row-entry"
          getRowClass={(p) => (p.data && !p.data.__read ? 'ag-row-unread' : undefined)}
          getRowId={(p) => p.data.__submission._id}
          enableCellTextSelection={false}
          tooltipShowDelay={400}
          animateRows={false}
          suppressCellFocus={false}
          aria-label={`${form?.title ?? 'Form'} responses, spreadsheet view`}
        />
      </div>
      <Group justify="space-between" className={classes.excelFooter}>
        <Text size="xs" c="dimmed">
          Read-only. Drag a range and press Ctrl+C to copy; drag a column heading to reorder.
        </Text>
        <Text size="xs" c="dimmed">
          {submissions.length} {submissions.length === 1 ? 'response' : 'responses'}
        </Text>
      </Group>
    </div>
  );
}
