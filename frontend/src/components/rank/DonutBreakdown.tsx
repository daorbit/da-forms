import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { num, share } from "./rankFormat";
import classes from "./Donut.module.css";

const PALETTE = [
  "var(--metric-blue)",
  "var(--metric-teal)",
  "var(--metric-orange)",
  "var(--metric-purple)",
  "var(--metric-pink)",
  "var(--metric-yellow)",
];
const OTHER_COLOR = "var(--viz-other)";
const OTHER_ID = "__other";

export type DonutItem = { id: string; label: ReactNode; title?: string; value: number };

type Slice = DonutItem & { color: string };

function toSlices(items: DonutItem[], limit: number): Slice[] {
  const top = items.slice(0, limit).map((item, i) => ({ ...item, color: PALETTE[i % PALETTE.length] }));
  const rest = items.slice(limit).reduce((sum, i) => sum + i.value, 0);
  return rest > 0 ? [...top, { id: OTHER_ID, label: "Other", value: rest, color: OTHER_COLOR }] : top;
}

export function DonutBreakdown({
  items,
  limit = 5,
  totalLabel = "Total",
  onSelect,
}: {
  items: DonutItem[];
  limit?: number;
  totalLabel?: string;
  onSelect?: (id: string) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const slices = toSlices(items, limit);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const focus = (active === null ? null : slices[active]) ?? slices[0] ?? null;
  const canSelect = (s: Slice) => Boolean(onSelect) && s.id !== OTHER_ID;
  const select = (s: Slice | undefined) => s && canSelect(s) && onSelect?.(s.id);
  const onKeyDown = (s: Slice) => (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    select(s);
  };

  return (
    <div className={classes.wrap}>
      <div className={classes.chart}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="id"
              innerRadius="80%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 1.5 : 0}
              cornerRadius={3}
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface)"
              strokeWidth={2}
              animationDuration={700}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={(_, i) => select(slices[i])}
            >
              {slices.map((s, i) => (
                <Cell
                  key={s.id}
                  fill={s.color}
                  fillOpacity={active === null || active === i ? 1 : 0.3}
                  className={canSelect(s) ? classes.sliceSelectable : undefined}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={classes.center}>
          <span className={classes.centerValue}>{focus ? share(focus.value, total) : num(total)}</span>
          <span className={classes.centerLabel}>{focus ? focus.label : totalLabel}</span>
        </div>
      </div>

      <ul className={classes.legend}>
        {slices.map((s, i) => (
          <li
            key={s.id}
            className={classes.legendRow}
            data-active={active === i || undefined}
            data-dim={(active !== null && active !== i) || undefined}
            data-selectable={canSelect(s) || undefined}
            role={canSelect(s) ? "button" : undefined}
            tabIndex={canSelect(s) ? 0 : undefined}
            title={s.title}
            style={{ "--dot": s.color } as CSSProperties}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onClick={() => select(s)}
            onKeyDown={onKeyDown(s)}
          >
            <span className={classes.dot} />
            <span className={classes.legendLabel}>{s.label}</span>
            <span className={classes.legendValue}>{num(s.value)}</span>
            <span className={classes.legendShare}>{share(s.value, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
