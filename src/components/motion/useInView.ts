import { useState, useEffect, useRef, RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Performant viewport-trigger hook using native IntersectionObserver.
 * Triggers entrance animation once when element enters viewport.
 */
export const useInView = <T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): [RefObject<T | null>, boolean] => {
  const { threshold = 0.01, rootMargin = '80px 0px 80px 0px', triggerOnce = true } = options;
  const elementRef = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If reduced motion is requested, immediately show content without observer delay
    if (prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    // Safety fallback: ensure content is never permanently stuck invisible
    const safetyTimer = setTimeout(() => {
      setIsInView(true);
    }, 200);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(safetyTimer);
            setIsInView(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      clearTimeout(safetyTimer);
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  return [elementRef, isInView];
};
