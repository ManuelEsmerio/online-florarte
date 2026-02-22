
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DayPicker, CaptionProps } from "react-day-picker"
import { es } from 'date-fns/locale';
import { addYears, subYears, format, addMonths, subMonths } from 'date-fns';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || props.defaultMonth || new Date());

  React.useEffect(() => {
    if (props.month) {
      setMonth(props.month);
    }
  }, [props.month]);

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
    props.onMonthChange?.(newMonth);
  }

  function CustomCaption({ displayMonth }: CaptionProps) {
    const handlePreviousYear = () => handleMonthChange(subYears(displayMonth, 1));
    const handleNextYear = () => handleMonthChange(addYears(displayMonth, 1));
    const handlePreviousMonth = () => handleMonthChange(subMonths(displayMonth, 1));
    const handleNextMonth = () => handleMonthChange(addMonths(displayMonth, 1));
    
    return (
      <div className="flex justify-between items-center w-full px-1 mb-6">
        <div className="flex gap-1">
          <Button type="button" onClick={handlePreviousYear} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <ChevronsLeft className="h-4 w-4" />
          </Button>
           <Button type="button" onClick={handlePreviousMonth} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 text-center font-bold capitalize text-base text-foreground">
          {format(displayMonth, 'MMMM yyyy', { locale: es })}
        </div>
        <div className="flex gap-1">
           <Button type="button" onClick={handleNextMonth} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <ChevronRight className="h-4 w-4" />
          </Button>
           <Button type="button" onClick={handleNextYear} variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
              <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };


  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      weekStartsOn={1}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-0",
        caption: "flex justify-center pt-1 relative items-center mb-1",
        caption_label: "text-sm font-medium hidden",
        nav: "space-x-1 flex items-center hidden",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 mb-4",
        head_cell:
          "text-muted-foreground/60 w-full font-bold text-[0.7rem] uppercase text-center",
        row: "grid grid-cols-7 w-full gap-y-2",
        cell: "relative h-10 w-full p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: cn(
          "h-10 w-10 p-0 font-medium mx-auto flex items-center justify-center rounded-full transition-all hover:bg-primary/15"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground focus:!bg-primary focus:!text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/30",
        day_today: "border-2 border-primary text-primary font-bold bg-transparent aria-selected:!bg-primary aria-selected:!text-primary-foreground",
        day_outside:
          "day-outside text-muted-foreground/30 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground/20 opacity-30",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
       components={{
        Caption: CustomCaption,
      }}
      month={month}
      onMonthChange={handleMonthChange}
      locale={es}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
