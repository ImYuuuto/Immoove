import { useEffect, useRef } from 'react';

export function useMagnetic<T extends HTMLElement = HTMLElement>(maxDistance = 5) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (prefersReducedMotion || isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.hypot(distanceX, distanceY);
      const radius = Math.max(rect.width, rect.height) * 0.75;

      if (distance < radius) {
        const factor = (1 - distance / radius) * maxDistance;
        const moveX = (distanceX / distance) * factor;
        const moveY = (distanceY / distance) * factor;
        el.style.transform = `translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0)`;
      } else {
        if (el.style.transform && el.style.transform !== 'translate3d(0px, 0px, 0px)') {
          el.style.transform = 'translate3d(0, 0, 0)';
        }
      }
    };

    const handleMouseLeave = () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (el) el.style.transform = '';
    };
  }, [maxDistance]);

  return ref;
}
