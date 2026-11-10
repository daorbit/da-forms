import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { RankTone } from "./tones";
import classes from "./Rank.module.css";

export type RankItem = {
  id: string;
  label: ReactNode;
  title?: string;
  value: ReactNode;
  weight?: number;
  aside?: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  tone?: RankTone;
};

export type RankColumns = {
  label: ReactNode;
  value: ReactNode;
  aside?: ReactNode;
};

function RankRow({
  item,
  position,
  showRank,
  share,
  selected,
  onSelect,
}: {
  item: RankItem;
  position: number;
  showRank: boolean;
  share?: number;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  const selectable = Boolean(onSelect);
  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    onSelect?.(item.id);
  };

  return (
    <li
      className={classes.row}
      data-tone={item.tone}
      data-selectable={selectable || undefined}
      data-selected={selected || undefined}
      aria-pressed={onSelect ? selected : undefined}
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      title={item.title}
      onClick={selectable ? () => onSelect?.(item.id) : undefined}
      onKeyDown={selectable ? onKeyDown : undefined}
    >
      {showRank && <span className={classes.rank}>{position}</span>}
      {item.leading && <span className={classes.leading}>{item.leading}</span>}
      <span className={classes.main}>
        <span className={classes.label}>
          <span className={classes.labelText}>{item.label}</span>
          {item.meta && <span className={classes.meta}>{item.meta}</span>}
        </span>
        {share !== undefined && (
          <span className={classes.track} aria-hidden>
            <span className={classes.bar} style={{ "--share": `${share}%` } as CSSProperties} />
          </span>
        )}
      </span>
      <span className={classes.value}>{item.value}</span>
      {item.aside && <span className={classes.aside}>{item.aside}</span>}
    </li>
  );
}

export function RankList({
  items,
  limit = 8,
  showRank = false,
  selectedId,
  columns,
  onSelect,
}: {
  items: RankItem[];
  limit?: number;
  showRank?: boolean;
  selectedId?: string | null;
  columns?: RankColumns;
  onSelect?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflow = items.length > limit;
  const visible = expanded || !overflow ? items : items.slice(0, limit);
  const weighted = items.length > 0 && items.every((i) => typeof i.weight === "number");
  const top = weighted ? Math.max(...items.map((i) => i.weight ?? 0), 0) : 0;

  return (
    <div className={classes.listWrap}>
      {columns && (
        <div className={classes.columns} aria-hidden>
          <span className={classes.columnLabel}>{columns.label}</span>
          <span>{columns.value}</span>
          {columns.aside && <span className={classes.columnAside}>{columns.aside}</span>}
        </div>
      )}
      <ol className={classes.list}>
        {visible.map((item, index) => (
          <RankRow
            key={item.id}
            item={item}
            position={index + 1}
            showRank={showRank}
            share={weighted && top > 0 ? Math.max(((item.weight ?? 0) / top) * 100, 1.5) : undefined}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ))}
      </ol>
      {overflow && (
        <button type="button" className={classes.more} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : `Show all ${items.length}`}
          <ChevronDown size={14} className={classes.moreIcon} data-open={expanded || undefined} />
        </button>
      )}
    </div>
  );
}
