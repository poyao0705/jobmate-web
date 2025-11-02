"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ id, checked = false, onCheckedChange, className, disabled, ...props }, ref) => {
    const toggle = React.useCallback(() => {
      if (disabled) return
      onCheckedChange?.(!checked)
    }, [checked, onCheckedChange, disabled])

    return (
      <div
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input
          id={id}
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </div>
    )
  }
)

Switch.displayName = "Switch"

export default Switch

