"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"

type ShareButtonProps = {
  path: string
  title: string
  label?: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "icon"
}

export function ShareButton({
  path,
  title,
  label = "Share",
  className,
  variant = "outline",
  size = "sm",
}: ShareButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const url = path.startsWith("http") ? path : `${window.location.origin}${path}`
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url, text: title })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: "Link copied ✨", description: "Send it to whoever needs it." })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      if ((err as { name?: string } | null)?.name === "AbortError") return
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        toast({ title: "Link copied ✨" })
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast({ variant: "destructive", title: "Could not copy link" })
      }
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full gap-1.5", className)}
      onClick={() => void share()}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {size !== "icon" ? (copied ? "Copied" : label) : null}
    </Button>
  )
}
