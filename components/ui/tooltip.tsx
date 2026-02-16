"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  className,
  side = "bottom",
  align = "center",
  sideOffset = 6,
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false)

  if (disabled) return <>{children}</>

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          className="inline-flex"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "w-auto max-w-[260px] px-2 py-1 text-[11px] leading-tight pointer-events-none",
          className
        )}
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}

