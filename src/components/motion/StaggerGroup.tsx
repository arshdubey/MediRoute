import React from 'react';
import { Reveal } from './Reveal';

interface StaggerGroupProps {
  children: React.ReactNode;
  baseDelay?: number;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  itemClassName?: string;
}

/**
 * StaggerGroup component that assigns progressive animation delays to its child items.
 * Enhances rhythmic entrance of tables, cards, and metric rows without blocking interactivity.
 */
export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  baseDelay = 0,
  staggerDelay = 55,
  direction = 'up',
  className = '',
  itemClassName = '',
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <Reveal
          key={index}
          delay={baseDelay + index * staggerDelay}
          direction={direction}
          className={itemClassName}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
};
