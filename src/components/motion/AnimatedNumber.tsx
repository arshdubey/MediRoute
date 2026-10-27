import React, { useEffect, useState, useRef } from 'react';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Editorial Number Count-Up Transition.
 * Smoothly animates numbers when entering viewport or when application state updates.
 * Never fabricates values and respects reduced-motion accessibility.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 650,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [ref, isInView] = useInView<HTMLSpanElement>({ threshold: 0.1, triggerOnce: true });
  const [displayValue, setDisplayValue] = useState<number>(() => value);
  const previousValueRef = useRef<number>(value);
  const animationFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !isInView) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const startValue = previousValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;

    if (difference === 0 && startValue === endValue) {
      setDisplayValue(value);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease-out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isInView, duration, prefersReducedMotion]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span ref={ref} className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
