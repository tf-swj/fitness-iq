import { useState, useEffect } from 'react';

export function useCountUp(target, duration = 1000, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target && target !== 0) return;
    const num = parseFloat(target) || 0;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((num * eased).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);

  return value;
}
