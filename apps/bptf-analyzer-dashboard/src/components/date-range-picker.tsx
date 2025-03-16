"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useController, UseControllerProps, FieldValues, Path, PathValue } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Fix the interface by making it more specific about the field type
interface DatePickerWithRangeProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  control: UseControllerProps<TFieldValues, TName>['control']
  name: TName
  defaultValue?: PathValue<TFieldValues, TName>
  rules?: UseControllerProps<TFieldValues, TName>['rules']
  disabled?: boolean // Add this prop
}

export function DatePickerWithRange<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  className,
  control,
  name,
  defaultValue,
  rules,
  disabled, // Add this to the props
  ...rest
}: DatePickerWithRangeProps<TFieldValues, TName>) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue,
    rules,
  })

  // Create default date range if not provided
  const defaultDateRange: DateRange = React.useMemo(() => ({
    from: new Date(),
    to: addDays(new Date(), 7),
  }), []);

  // Use value from form or fall back to default
  const dateRange = value as DateRange || defaultDateRange;

  return (
    <div className={cn("grid gap-2", className)} {...rest}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            disabled={disabled} // Pass the disabled prop here
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onChange}
            numberOfMonths={2}
            disabled={disabled ? { before: new Date(0), after: new Date(0) } : undefined} // Disable all dates
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}