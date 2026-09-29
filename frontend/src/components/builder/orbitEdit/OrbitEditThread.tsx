import { useEffect, useRef } from 'react';
import { ColorSwatch, ScrollArea, Tooltip } from '@mantine/core';
import { OrbitMark } from '@/components/OrbitMark';
import { replyText, type OrbitEditTurn } from './turns';
import classes from './orbitEdit.module.css';

interface Props {
  turns: OrbitEditTurn[];
  busy: boolean;
}

export function OrbitEditThread({ turns, busy }: Props) {
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  return (
    <ScrollArea className={classes.scroll} type="hover" scrollbarSize={7}>
      <div className={classes.column}>
        {turns.map((turn, i) => {
          const pending = busy && i === turns.length - 1 && turn.changes === undefined;
          return (
            <div key={i} className={classes.turn}>
              <div className={classes.userRow}>
                <div className={classes.userBubble}>{turn.prompt}</div>
              </div>

              <div className={classes.answer}>
                <div className={classes.answerHead}>
                  <OrbitMark size={20} className={pending ? classes.markPulse : undefined} />
                  {pending ? (
                    <span className={classes.thinking}>Thinking</span>
                  ) : (
                    <span className={classes.answerName}>Orbit</span>
                  )}
                </div>

                {turn.changes !== undefined && (
                  <div className={classes.answerBody}>
                    <p className={classes.answerText}>{replyText(turn)}</p>
                    {turn.themeColors && (
                      <div className={classes.swatches}>
                        {turn.themeColors.map(([key, hex]) => (
                          <Tooltip key={key} label={key} withArrow>
                            <span className={classes.swatch}>
                              <ColorSwatch color={hex} size={14} />
                              {hex}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
    </ScrollArea>
  );
}
