import { useEffect, useRef, useState } from 'react';

export function useStuck<T extends HTMLElement>() {
  const sentinel = useRef<T>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { sentinel, stuck };
}
