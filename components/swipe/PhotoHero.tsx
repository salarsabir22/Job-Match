import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PhotoHero({
  src,
  fallback,
  children,
  className,
  fit = "cover",
}: {
  src?: string | null
  fallback: ReactNode
  children: ReactNode
  className?: string
  fit?: "cover" | "contain"
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-[#1d1d1f]",
        "h-[min(42vh,19rem)] sm:h-[min(48vh,23rem)] lg:h-[min(52vh,26rem)]",
        className
      )}
    >
      {src ? (
        <>
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-50"
            draggable={false}
          />
          <img
            src={src}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full",
              fit === "contain" ? "object-contain p-10 sm:p-14" : "object-cover"
            )}
            draggable={false}
          />
        </>
      ) : (
        <div className="apple-vibrancy-header absolute inset-0 flex items-center justify-center">{fallback}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">{children}</div>
    </div>
  )
}
