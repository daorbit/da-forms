import { useEffect, useRef } from 'react';

export interface ShortcutActions {
  selectedId: string | null;
  editingId: string | null;
  canSave: boolean;
  save: () => void;
  openInsert: () => void;
  openShortcuts: () => void;
  openPreview: () => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  move: (id: string, delta: number) => void;
  closeProperties: () => void;
  deselect: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

function insideDialog(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest?.('[role="dialog"]'));
}

export function useBuilderShortcuts(actions: ShortcutActions) {
  const ref = useRef(actions);
  ref.current = actions;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const a = ref.current;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 's') {
        e.preventDefault();
        if (a.canSave) a.save();
        return;
      }

      if (isTyping(e.target) || insideDialog(e.target)) return;

      if ((mod && key === 'k') || (!mod && e.key === '/')) {
        e.preventDefault();
        a.openInsert();
        return;
      }
      if (!mod && e.key === '?') {
        e.preventDefault();
        a.openShortcuts();
        return;
      }
      if (mod && e.shiftKey && key === 'p') {
        e.preventDefault();
        a.openPreview();
        return;
      }
      if (e.key === 'Escape') {
        if (a.editingId) a.closeProperties();
        else a.deselect();
        return;
      }

      const id = a.selectedId;
      if (!id) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        a.remove(id);
      } else if (mod && key === 'd') {
        e.preventDefault();
        a.duplicate(id);
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        a.move(id, e.key === 'ArrowUp' ? -1 : 1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
