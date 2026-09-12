"use client"

import type { ReactNode } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function DiscoverFilterSheet({
  count,
  children,
}: {
  count: number
  children: ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="rounded-full">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count > 0 ? (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
              {count}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow this stack. Changing filters resets you to the first card.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid gap-3 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
