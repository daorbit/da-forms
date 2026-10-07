export interface ShortcutGroup {
  title: string;
  items: { keys: string[]; label: string }[];
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export const MOD = isMac ? '⌘' : 'Ctrl';
export const ALT = isMac ? '⌥' : 'Alt';

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Building',
    items: [
      { keys: ['/'], label: 'Insert a field' },
      { keys: [MOD, 'K'], label: 'Insert a field' },
      { keys: [MOD, 'D'], label: 'Duplicate selected field' },
      { keys: ['Delete'], label: 'Delete selected field' },
      { keys: [ALT, '↑'], label: 'Move field up' },
      { keys: [ALT, '↓'], label: 'Move field down' },
    ],
  },
  {
    title: 'Editing',
    items: [
      { keys: [MOD, 'Z'], label: 'Undo' },
      { keys: [MOD, 'Shift', 'Z'], label: 'Redo' },
      { keys: ['Enter'], label: 'Finish editing text' },
      { keys: ['Esc'], label: 'Close panel or deselect' },
    ],
  },
  {
    title: 'Form',
    items: [
      { keys: [MOD, 'S'], label: 'Save' },
      { keys: [MOD, 'Shift', 'P'], label: 'Preview' },
      { keys: ['?'], label: 'Show shortcuts' },
    ],
  },
];
