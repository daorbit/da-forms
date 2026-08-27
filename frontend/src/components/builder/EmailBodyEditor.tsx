import { useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { ActionIcon, Divider, Group, Tooltip } from '@mantine/core';
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconLink,
  IconLinkOff,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconH1,
  IconH2,
} from '@tabler/icons-react';
import classes from './EmailBodyEditor.module.css';

interface Props {
  /** The message as HTML. */
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Rendered at the end of the toolbar — the Field Labels menu belongs there. */
  toolbarExtra?: React.ReactNode;
  /** Handed back so the placeholder menu can insert at the caret. */
  onReady?: (editor: Editor | null) => void;
}

/**
 * The message body, as rich text.
 *
 * Unlike the caption editor in the analytics app — which keeps everything plain
 * because LinkedIn strips markup — this one's whole output is HTML, because
 * that is exactly what a mail client renders. The toolbar is deliberately
 * shaped like that one so the two feel like the same product.
 *
 * The formatting offered is only what survives email: bold, italic, underline,
 * strike, headings, lists, links and alignment. No fonts or colours, which are
 * the first things a mail client overrides, and which would fight the template
 * wrapped around this.
 */
export function EmailBodyEditor({
  value,
  onChange,
  disabled,
  placeholder = 'Write your message…',
  toolbarExtra,
  onReady,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Not offered by the toolbar and not worth carrying into an email,
        // where both render inconsistently across clients.
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    onReady?.(editor);
  }, [editor, onReady]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // Only writes back when the value came from somewhere other than typing —
  // pushing every keystroke back in would collapse the caret to the start.
  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  type Item = {
    icon: typeof IconBold;
    label: string;
    hint?: string;
    run: () => void;
    active?: boolean;
  };

  const items: (Item | null)[] = [
    {
      icon: IconBold,
      label: 'Bold',
      hint: 'Ctrl+B',
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      icon: IconItalic,
      label: 'Italic',
      hint: 'Ctrl+I',
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      icon: IconUnderline,
      label: 'Underline',
      hint: 'Ctrl+U',
      run: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive('underline'),
    },
    {
      icon: IconStrikethrough,
      label: 'Strikethrough',
      run: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive('strike'),
    },
    null,
    {
      icon: IconH1,
      label: 'Heading',
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: IconH2,
      label: 'Subheading',
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive('heading', { level: 3 }),
    },
    null,
    {
      icon: IconList,
      label: 'Bullet list',
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
    },
    {
      icon: IconListNumbers,
      label: 'Numbered list',
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
    },
    null,
    {
      icon: IconAlignLeft,
      label: 'Align left',
      run: () => editor.chain().focus().setTextAlign('left').run(),
      active: editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: IconAlignCenter,
      label: 'Align centre',
      run: () => editor.chain().focus().setTextAlign('center').run(),
      active: editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: IconAlignRight,
      label: 'Align right',
      run: () => editor.chain().focus().setTextAlign('right').run(),
      active: editor.isActive({ textAlign: 'right' }),
    },
    null,
    {
      icon: IconLink,
      label: 'Add link',
      run: () => {
        const previous = editor.getAttributes('link').href as string | undefined;
        const href = window.prompt('Link URL', previous ?? 'https://');
        if (href === null) return;
        if (href === '') {
          editor.chain().focus().unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      },
      active: editor.isActive('link'),
    },
    {
      icon: IconLinkOff,
      label: 'Remove link',
      run: () => editor.chain().focus().unsetLink().run(),
    },
  ];

  return (
    <div className={classes.wrap} data-disabled={disabled || undefined}>
      <Group gap={2} px={8} py={6} wrap="nowrap" className={classes.toolbar}>
        {items.map((item, i) => {
          if (item === null) return <Divider key={`sep-${i}`} orientation="vertical" mx={4} my={3} />;
          return (
            <Tooltip
              key={item.label}
              label={item.hint ? `${item.label} · ${item.hint}` : item.label}
              withArrow
              openDelay={400}
            >
              <ActionIcon
                variant={item.active ? 'light' : 'subtle'}
                color={item.active ? 'emerald' : 'gray'}
                size="md"
                // The selection has to survive the click, or formatting would
                // act on nothing: focusing the button clears it first.
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.run}
                disabled={disabled}
                aria-label={item.label}
              >
                <item.icon size={16} />
              </ActionIcon>
            </Tooltip>
          );
        })}

        {toolbarExtra && (
          <>
            <Divider orientation="vertical" mx={4} my={3} />
            {toolbarExtra}
          </>
        )}
      </Group>

      <EditorContent editor={editor} className={classes.content} data-placeholder={placeholder} />
    </div>
  );
}
