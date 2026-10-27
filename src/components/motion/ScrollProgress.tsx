import React, { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Thin, elegant scroll progress indicator fixed at the top of the viewport.
 * Reflects actual document scroll progress using lightweight requestAnimationFrame tracking.
 */
export const ScrollProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setProgress(0);
        ticking = false;
        return;
      }
      const scrollPercent = Math.min(1, Math.max(0, scrollTop / docHeight));
      setProgress(scrollPercent);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    updateScrollProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  if (prefersReducedMotion || progress <= 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none bg-[#E5E3DC]"
    >
      <div
        className="h-full bg-[#E74732] transition-transform duration-75 ease-out origin-left"
        style={{
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
};
