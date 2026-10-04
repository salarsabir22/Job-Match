"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

export type AccordionItemData = { q: string; a: string }

/** shadcn Accordion styled as a stack of cards. One item open at a time. */
export function QAAccordion({
  items,
  defaultOpen = 0,
  className,
}: {
  items: AccordionItemData[]
  defaultOpen?: number | null
  className?: string
}) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen === null ? undefined : `item-${defaultOpen}`}
      className={cn("flex flex-col gap-2.5", className)}
    >
      {items.map((item, i) => (
        <AccordionItem
          key={item.q}
          value={`item-${i}`}
          className="rounded-2xl border bg-card px-5 transition-colors data-[state=open]:border-[var(--lp-accent)]/60 data-[state=open]:bg-[#f1efff]"
        >
          <AccordionTrigger className="text-[15px] hover:text-[var(--lp-accent)]">{item.q}</AccordionTrigger>
          <AccordionContent className="text-[15px] leading-[1.6] text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
