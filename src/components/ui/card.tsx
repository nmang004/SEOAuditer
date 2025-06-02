"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Animated } from '@/components/animations/animated';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    glass?: boolean;
    hover?: boolean;
    noAnimate?: boolean;
  }
>(({ className, glass = false, hover = false, noAnimate = false, ...props }, ref) => {
  // Filter out non-animated props
  const { onDrag, onDragStart, onDragEnd, onAnimationStart, onAnimationEnd, children, ...divProps } = props;
  
  // If noAnimate is true, render without animation wrapper
  if (noAnimate) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          glass && "glassmorphism border-opacity-30",
          hover &&
            "transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:-translate-y-1",
          className
        )}
        {...divProps}
      >
        {children}
      </div>
    );
  }
  
  return (
    <Animated
      ref={ref}
      type="fade"
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        glass && "glassmorphism border-opacity-30",
        className
      )}
      style={{ willChange: 'transform, opacity' }}
      {...divProps}
    >
    <div
      className={cn(
        hover &&
          "transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:-translate-y-1",
        "h-full w-full"
      )}
    >
      {children}
    </div>
  </Animated>
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
