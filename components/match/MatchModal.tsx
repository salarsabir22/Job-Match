"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getInitials } from "@/lib/utils"

function Face({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary ring-4 ring-background">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name || "?")}</span>
      )}
    </div>
  )
}

export function MatchModal({
  open,
  onOpenChange,
  name,
  chatHref,
  imageUrl,
  selfImageUrl,
  selfName = "You",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  chatHref: string | null
  imageUrl?: string | null
  selfImageUrl?: string | null
  selfName?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="relative mx-auto mb-2 h-24 w-48">
            <div className="absolute left-2 top-2">
              <Face src={selfImageUrl} name={selfName} />
            </div>
            <div className="absolute right-2 top-2">
              <Face src={imageUrl} name={name} />
            </div>
            <div className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Heart className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
            </div>
          </div>
          <DialogTitle className="font-heading text-2xl">It’s a match</DialogTitle>
          <DialogDescription>
            You and {name} both showed interest. Open chat to take the next step.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {chatHref ? (
            <Button asChild className="w-full rounded-full">
              <Link href={chatHref}>Open chat</Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full rounded-full" onClick={() => onOpenChange(false)}>
            Keep swiping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
