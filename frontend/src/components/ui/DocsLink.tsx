import { BookOpen } from 'lucide-react';
import { docsUrl } from '@/lib/docs';
import classes from './DocsLink.module.css';

interface Props {
  path: string;
  label?: string;
}

export function DocsLink({ path, label = 'How this works' }: Props) {
  return (
    <a className={classes.link} href={docsUrl(path)} target="_blank" rel="noopener noreferrer">
      <BookOpen size={13} />
      {label}
    </a>
  );
}
