import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "warning" | "danger";
    indicatorClassName?: string;
    indicatorColor?: "primary" | "success" | "warning" | "danger";
  }
>(({ className, value, variant = "default", indicatorClassName, indicatorColor, ...props }, ref) => {
  const getVariantClass = () => {
    const color = indicatorColor || variant;
    switch (color) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-destructive";
      default:
        return "bg-primary";
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all",
          getVariantClass(),
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
