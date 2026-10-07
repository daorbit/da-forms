import { useLayoutEffect, useRef } from 'react';
import classes from './Canvas.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  enterFinishes?: boolean;
  ariaLabel: string;
  className?: string;
  onActivate?: () => void;
}

function stop(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function InlineText({
  value,
  onChange,
  placeholder,
  multiline = false,
  enterFinishes = false,
  ariaLabel,
  className,
  onActivate,
}: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, multiline]);

  const shared = {
    value,
    placeholder,
    'aria-label': ariaLabel,
    'data-inline': '',
    spellCheck: true,
    onPointerDown: stop,
    onMouseDown: stop,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onActivate?.();
    },
    onFocus: () => onActivate?.(),
  };

  if (multiline) {
    return (
      <textarea
        ref={areaRef}
        rows={1}
        className={`${classes.inline} ${classes.inlineArea} ${className ?? ''}`}
        onChange={(e) => onChange(enterFinishes ? e.currentTarget.value.replace(/\n/g, ' ') : e.currentTarget.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' || (enterFinishes && e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        {...shared}
      />
    );
  }

  return (
    <input
      type="text"
      size={Math.max(value.length, placeholder.length, 1)}
      className={`${classes.inline} ${className ?? ''}`}
      onChange={(e) => onChange(e.currentTarget.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
      }}
      {...shared}
    />
  );
}
