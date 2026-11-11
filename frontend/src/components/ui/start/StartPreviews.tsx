import classes from './StartPreviews.module.css';

const COLUMNS = [34, 52, 41, 68, 57, 80, 63, 92];

export function ColumnsPreview() {
  return (
    <div className={classes.columns}>
      {COLUMNS.map((h, i) => (
        <span key={i} className={classes.column} data-height={h} />
      ))}
    </div>
  );
}

const FUNNEL = [
  { label: 'Viewed', width: 'full' },
  { label: 'Started', width: 'most' },
  { label: 'Submitted', width: 'half' },
];

export function FunnelPreview() {
  return (
    <div className={classes.rows}>
      {FUNNEL.map((row) => (
        <div key={row.label} className={classes.row}>
          <span className={classes.rowLabel}>{row.label}</span>
          <span className={classes.track}>
            <span className={classes.fill} data-width={row.width} />
          </span>
        </div>
      ))}
    </div>
  );
}

const HEAT = [0, 1, 2, 1, 0, 1, 3, 2, 1, 0, 2, 3, 3, 2, 1, 1, 2, 2, 1, 0, 0, 1, 1, 0];

export function HeatmapPreview() {
  return (
    <div className={classes.heat}>
      {HEAT.map((level, i) => (
        <span key={i} className={classes.heatCell} data-level={level} />
      ))}
    </div>
  );
}

export function ListPreview({ rows }: { rows: { label: string; width: 'full' | 'most' | 'half' | 'third' }[] }) {
  return (
    <div className={classes.rows}>
      {rows.map((row) => (
        <div key={row.label} className={classes.row}>
          <span className={classes.rowLabel}>{row.label}</span>
          <span className={classes.track}>
            <span className={classes.fill} data-width={row.width} />
          </span>
        </div>
      ))}
    </div>
  );
}

const DOTS = ['Lead', 'Qualified', 'Won'];

export function StagesPreview() {
  return (
    <div className={classes.stages}>
      {DOTS.map((label, i) => (
        <span key={label} className={classes.stage} data-step={i}>
          {label}
        </span>
      ))}
    </div>
  );
}

const FIELDS = ['Name', 'Email', 'Pick a time'];

export function FormPreview() {
  return (
    <div className={classes.form}>
      {FIELDS.map((label) => (
        <span key={label} className={classes.field}>
          <span className={classes.fieldLabel}>{label}</span>
          <span className={classes.fieldInput} />
        </span>
      ))}
      <span className={classes.submit} />
    </div>
  );
}
