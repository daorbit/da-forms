import { useEffect, useRef } from 'react';
import type { CalendarScope } from './calendarDates';

interface Handlers {
  onToday: () => void;
  onStep: (direction: 1 | -1) => void;
  onScope: (scope: CalendarScope) => void;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useCalendarShortcuts(handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const h = ref.current;
      switch (event.key) {
        case 't':
        case 'T':
          h.onToday();
          break;
        case 'ArrowLeft':
          h.onStep(-1);
          break;
        case 'ArrowRight':
          h.onStep(1);
          break;
        case 'm':
        case 'M':
          h.onScope('month');
          break;
        case 'w':
        case 'W':
          h.onScope('week');
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
