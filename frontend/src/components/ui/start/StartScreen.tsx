import type { ReactNode } from 'react';
import classes from './StartScreen.module.css';

export function StartScreen({ children }: { children: ReactNode }) {
  return <div className={classes.start}>{children}</div>;
}

export function StartHero({
  id,
  icon,
  title,
  text,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  text: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={classes.hero} aria-labelledby={id}>
      <div className={classes.heroGrid} aria-hidden />
      <div className={classes.heroMain}>
        <span className={classes.heroMark} aria-hidden>
          {icon}
        </span>
        <h2 id={id} className={classes.heroTitle}>
          {title}
        </h2>
        <p className={classes.heroText}>{text}</p>
        {children && <div className={classes.heroBody}>{children}</div>}
      </div>
    </section>
  );
}

export function StartSection({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className={classes.sectionHead}>
        <h3 id={id} className={classes.sectionTitle}>
          {title}
        </h3>
        {sub && <p className={classes.sectionSub}>{sub}</p>}
      </div>
      <div className={classes.cards}>{children}</div>
    </section>
  );
}

export function StartCard({
  icon,
  title,
  text,
  preview,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  preview: ReactNode;
}) {
  return (
    <article className={classes.card}>
      <span className={classes.cardPreview} aria-hidden>
        {preview}
      </span>
      <span className={classes.cardBody}>
        <span className={classes.cardHead}>
          <span className={classes.cardIcon}>{icon}</span>
          <span className={classes.cardTitle}>{title}</span>
        </span>
        <span className={classes.cardText}>{text}</span>
      </span>
    </article>
  );
}
