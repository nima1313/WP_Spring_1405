"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { toJalali, jalaliToGregorian, isValidJalali } from "@/lib/jalali"
import { cn } from "@/lib/utils"

interface JalaliDateInputProps {
  /** Gregorian YYYY-MM-DD value stored in state / received from backend */
  value: string
  /** Called with a Gregorian YYYY-MM-DD string on valid commit, or "" when cleared */
  onChange: (gregorian: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  /**
   * When true, calls onChange on each keystroke that produces a valid date.
   * Use for filter inputs. Default false (blur-to-save, for header fields).
   */
  liveUpdate?: boolean
}

export function JalaliDateInput({
  value,
  onChange,
  className,
  disabled,
  required,
  liveUpdate = false,
}: JalaliDateInputProps) {
  const [display, setDisplay] = useState(() => toJalali(value))
  const [prevValue, setPrevValue] = useState(value)
  const [invalid, setInvalid] = useState(false)

  // Sync display when the parent value changes (e.g. after query refetch)
  // Uses the React derived-state-during-render pattern to avoid useEffect.
  if (value !== prevValue) {
    setPrevValue(value)
    setDisplay(toJalali(value))
    setInvalid(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setDisplay(raw)
    setInvalid(false)

    if (liveUpdate) {
      if (raw === "") {
        onChange("")
      } else if (isValidJalali(raw)) {
        onChange(jalaliToGregorian(raw))
      }
    }
  }

  function handleBlur() {
    if (display === "") {
      setInvalid(false)
      onChange("")
      return
    }
    const gregorian = jalaliToGregorian(display)
    if (!gregorian) {
      setInvalid(true)
      setDisplay(toJalali(value))
    } else {
      setInvalid(false)
      setDisplay(toJalali(gregorian))
      if (gregorian !== value) onChange(gregorian)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur()
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="مثال: ۱۴۰۳/۰۲/۱۵"
      className={cn(className, invalid && "border-destructive focus-visible:ring-destructive/50")}
      aria-invalid={invalid}
      disabled={disabled}
      required={required}
    />
  )
}
