"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { PAKISTANI_UNIVERSITIES, UNIVERSITY_OTHER } from "@/lib/pakistan-universities"
import { cn } from "@/lib/utils"

export function UniversityPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? PAKISTANI_UNIVERSITIES.filter((u) => u.toLowerCase().includes(q))
      : [...PAKISTANI_UNIVERSITIES]
    return [...list.slice(0, 40), UNIVERSITY_OTHER]
  }, [query])

  const known = (PAKISTANI_UNIVERSITIES as readonly string[]).includes(value)

  return (
    <div className="relative">
      <Input
        className="h-11 rounded-xl"
        placeholder="Search any university in Pakistan"
        value={open ? query : value}
        onFocus={() => {
          setQuery(value && !known ? value : "")
          setOpen(true)
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (!known) onChange(e.target.value)
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
        }}
      />
      {open ? (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">
          {filtered.map((uni) => (
            <li key={uni}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left font-body text-sm hover:bg-muted",
                  value === uni && "bg-muted font-medium"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (uni === UNIVERSITY_OTHER) {
                    onChange("")
                    setQuery("")
                    setOpen(false)
                    return
                  }
                  onChange(uni)
                  setQuery("")
                  setOpen(false)
                }}
              >
                {uni}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
