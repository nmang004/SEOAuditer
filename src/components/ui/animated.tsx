import { forwardRef, ReactNode, useState } from 'react';
import { m, MotionProps, useReducedMotion, Variants  } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeIn, slideUp, scaleIn } from '@/lib/animations/animations';

type AnimationType = 'fade' | 'slide' | 'scale' | 'none';

// Simplified props interface
interface AnimatedProps extends Omit<MotionProps, 'ref'> {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  disabled?: boolean;
  viewport?: {
    once?: boolean;
    margin?: string;
    amount?: 'some' | 'all' | number;
  };
}

type AnimationVariant = {
  hidden: Record<string, unknown>;
  visible: Record<string, unknown> | ((delay?: number) => Record<string, unknown>);
};

const animationMap: Record<AnimationType, AnimationVariant> = {
  fade: fadeIn as AnimationVariant,
  slide: slideUp as AnimationVariant,
  scale: scaleIn as AnimationVariant,
  none: { hidden: {}, visible: {} },
};

// Create a simplified Animated component without the 'as' prop
export const Animated = forwardRef<HTMLDivElement, AnimatedProps>(
  ({
    children,
    type = 'fade',
    delay = 0,
    duration,
    className,
    disabled = false,
    viewport = { once: true, margin: '0px' },
    ...props
  }, ref) => {
    const reducedMotion = useReducedMotion();
    const [isInView, setIsInView] = useState(disabled || reducedMotion);
    
    const animationVariant = disabled || reducedMotion ? animationMap.none : animationMap[type];

    // Apply custom duration if provided
    const variants: Variants = {
      hidden: animationVariant.hidden,
      visible: (typeof animationVariant.visible === 'function'
        ? animationVariant.visible(delay)
        : animationVariant.visible) as Record<string, unknown>
    };

    // Add transition with custom duration if provided
    if (variants.visible) {
      variants.visible = {
        ...variants.visible,
        transition: {
          ...(variants.visible as any).transition,
          delay: duration === undefined ? delay : undefined,
          duration: duration !== undefined ? duration : undefined,
        },
      };
    }

    // Skip animation if disabled or reduced motion is preferred
    if (disabled || reducedMotion) {
      return (
        <m.div
          ref={ref}
          className={cn(className)}
          {...props}
        >
          {children}
        </m.div>
      );
    }

    return (
      <m.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={cn(className)}
        viewport={{
          ...viewport,
          margin: viewport?.margin,
          amount: viewport?.amount,
        }}
        onViewportEnter={() => setIsInView(true)}
        onViewportLeave={() => !viewport?.once && setIsInView(false)}
        {...props}
      >
        {children}
      </m.div>
    );
  }
);

Animated.displayName = 'Animated';

// Re-export motion components for convenience
import { motion as framerMotion } from 'framer-motion';
export { framerMotion as motion };

// Helper components for common animations
export const Fade = forwardRef<HTMLDivElement, Omit<AnimatedProps, 'type'>>((props, ref) => (
  <Animated ref={ref} type="fade" {...props} />
));
Fade.displayName = 'Fade';

export const SlideUp = forwardRef<HTMLDivElement, Omit<AnimatedProps, 'type'>>((props, ref) => (
  <Animated ref={ref} type="slide" {...props} />
));
SlideUp.displayName = 'SlideUp';

export const Scale = forwardRef<HTMLDivElement, Omit<AnimatedProps, 'type'>>((props, ref) => (
  <Animated ref={ref} type="scale" {...props} />
));
Scale.displayName = 'Scale';
