"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useController, UseControllerProps, FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"

interface HoursSliderProps<T extends FieldValues> extends UseControllerProps<T> {
  label?: string
  className?: string
  disabled?: boolean
}

export function HoursSlider<T extends FieldValues>({
  label = "Hours",
  className,
  control,
  name,
  defaultValue,
  rules,
  disabled,
  ...rest
}: HoursSliderProps<T>) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue,
    rules,
  })

  // Convert to number for display
  const currentValue = Number(value) || 2

  return (
    <div className={className}>
      <div className="flex justify-between mb-2">
        <Label htmlFor={`hours-slider-${name}`}>{label}</Label>
        <span className={cn("font-medium", disabled && "opacity-50")}>
          {currentValue} {currentValue === 1 ? "hour" : "hours"}
        </span>
      </div>
      <Slider
        id={`hours-slider-${name}`}
        min={2}
        max={24}
        step={1}
        value={[currentValue]}
        onValueChange={(newValue) => onChange(newValue[0])}
        disabled={disabled}
        {...rest}
      />
    </div>
  )
}