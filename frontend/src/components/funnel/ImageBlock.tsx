import { Text } from '@mantine/core';
import { ImageIcon } from 'lucide-react';
import type { FormField } from '@/types';
import classes from './ImageBlock.module.css';

export function ImageBlock({ field }: { field: FormField }) {
  if (!field.imageUrl) {
    return (
      <div className={classes.empty}>
        <ImageIcon size={20} />
        <Text size="sm">Add an image in the field settings</Text>
      </div>
    );
  }

  return (
    <figure className={classes.figure} data-width={field.imageWidth ?? 'full'}>
      <img src={field.imageUrl} alt={field.imageAlt ?? ''} className={classes.image} loading="lazy" />
    </figure>
  );
}
