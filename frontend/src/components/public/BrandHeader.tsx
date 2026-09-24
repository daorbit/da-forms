import { useState } from 'react';
import type { FormBranding } from '@/types';
import classes from './BrandHeader.module.css';

export function BrandHeader({ branding }: { branding?: FormBranding }) {
  const [logoBroken, setLogoBroken] = useState(false);
  const header = branding?.header;
  if (!header) return null;

  const showLogo = Boolean(header.logoUrl) && !logoBroken;
  if (!showLogo && !header.name) return null;

  return (
    <div className={classes.header}>
      {showLogo && (
        <img
          src={header.logoUrl}
          alt={header.name ?? ''}
          className={classes.logo}
          onError={() => setLogoBroken(true)}
        />
      )}
      {header.name && <span className={classes.name}>{header.name}</span>}
    </div>
  );
}
