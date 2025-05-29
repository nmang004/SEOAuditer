"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import { Animated } from "@/components/animations/animated"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    asChild
    className={cn("z-50", className)}
    {...props}
  >
    <Animated type="fade" className="inline-block px-2 py-1 rounded bg-black text-white text-xs shadow-lg" style={{ willChange: "transform, opacity" }}>
      {props.children}
    </Animated>
  </TooltipPrimitive.Content>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export {
  TooltipProvider,
  TooltipRoot as Tooltip,
  TooltipTrigger,
  TooltipContent,
}
