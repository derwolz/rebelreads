import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  fromYear?: number
  toYear?: number
}

export function DatePicker({ 
  selected, 
  onSelect, 
  className, 
  label, 
  placeholder = "Pick a date", 
  disabled = false,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    selected ? new Date(selected) : undefined
  )
  const [month, setMonth] = React.useState<number>(
    selected ? selected.getMonth() : new Date().getMonth()
  )
  const [year, setYear] = React.useState<number>(
    selected ? selected.getFullYear() : new Date().getFullYear()
  )

  // Update the component when the selected prop changes
  React.useEffect(() => {
    if (selected) {
      setDate(new Date(selected))
      setMonth(selected.getMonth())
      setYear(selected.getFullYear())
    } else {
      setDate(undefined)
    }
  }, [selected])

  // Generate years array for the dropdown
  const years = React.useMemo(() => {
    const array = []
    for (let i = fromYear; i <= toYear; i++) {
      array.push(i)
    }
    return array
  }, [fromYear, toYear])

  // Month names for the dropdown
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Handle date change and propagate to parent
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setMonth(selectedDate.getMonth())
      setYear(selectedDate.getFullYear())
      onSelect?.(selectedDate)
    } else {
      onSelect?.(null)
    }
  }

  // Handle month change
  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value)
    setMonth(newMonth)
  }

  // Handle year change
  const handleYearChange = (value: string) => {
    const newYear = parseInt(value)
    setYear(newYear)
  }

  return (
    <div className={className}>
      {label && <span className="block text-sm font-medium mb-1">{label}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            <div className="flex space-x-2">
              <Select
                value={month.toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((monthName, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {monthName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={year.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yearValue) => (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            month={new Date(year, month)}
            onMonthChange={(newMonth) => {
              setMonth(newMonth.getMonth())
              setYear(newMonth.getFullYear())
            }}
            initialFocus
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
