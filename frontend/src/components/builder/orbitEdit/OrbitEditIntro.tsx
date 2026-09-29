import { UnstyledButton } from '@mantine/core';
import { ArrowUpRightIcon, MessageSquareTextIcon } from 'lucide-react';
import { OrbitMark } from '@/components/OrbitMark';
import { ORBIT_EDIT_STARTERS } from './turns';
import classes from './orbitEdit.module.css';

interface Props {
  disabled?: boolean;
  onPick: (prompt: string) => void;
}

export function OrbitEditIntro({ disabled, onPick }: Props) {
  return (
    <div className={classes.heroArea}>
      <div className={classes.hero}>
        <div className={classes.heroHead}>
          <OrbitMark size={80} />
          <h2 className={classes.heroTitle}>Edit with Orbit</h2>
          <p className={classes.heroSub}>
            Describe a change and Orbit applies it to the form on the canvas.
          </p>
        </div>

        {!disabled && (
          <div className={classes.starters}>
            <div className={classes.startersLabel}>Try asking</div>
            {ORBIT_EDIT_STARTERS.map((q) => (
              <UnstyledButton key={q} className={classes.starter} onClick={() => onPick(q)}>
                <MessageSquareTextIcon size={14} className={classes.starterIcon} />
                <span className={classes.starterText}>{q}</span>
                <ArrowUpRightIcon size={14} className={classes.starterArrow} />
              </UnstyledButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
