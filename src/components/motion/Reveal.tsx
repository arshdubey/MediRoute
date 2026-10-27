import React from 'react';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

/**
 * Editorial Viewport Reveal Component.
 * Triggers subtle, smooth upward/opacity entrance when element scrolls into view.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 400,
  direction = 'up',
  className = '',
  threshold = 0.08,
  triggerOnce = true,
}) => {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold, triggerOnce });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return 'translate3d(0, 12px, 0)';
      case 'down':
        return 'translate3d(0, -12px, 0)';
      case 'left':
        return 'translate3d(12px, 0, 0)';
      case 'right':
        return 'translate3d(-12px, 0, 0)';
      case 'none':
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translate3d(0, 0, 0)' : getInitialTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        willChange: isInView ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};
