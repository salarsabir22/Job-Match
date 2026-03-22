"use client"

import { Pause, Play } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

function formatDur(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

type VoiceMessagePlayerProps = {
  src: string
  durationSec: number
  /** Own message on navy bubble */
  isOwn: boolean
}

export function VoiceMessagePlayer({ src, durationSec, isOwn }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(() => Math.max(0.1, durationSec || 0.1))

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    setCurrent(a.currentTime)
  }, [])

  const onLoaded = useCallback(() => {
    const a = audioRef.current
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return
    setDuration(a.duration)
  }, [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onEnd = () => {
      setPlaying(false)
      setCurrent(0)
    }
    a.addEventListener("timeupdate", onTimeUpdate)
    a.addEventListener("loadedmetadata", onLoaded)
    a.addEventListener("ended", onEnd)
    return () => {
      a.removeEventListener("timeupdate", onTimeUpdate)
      a.removeEventListener("loadedmetadata", onLoaded)
      a.removeEventListener("ended", onEnd)
    }
  }, [onTimeUpdate, onLoaded, src])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    const bar = barRef.current
    if (!a || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width)
    a.currentTime = (x / rect.width) * duration
    setCurrent(a.currentTime)
  }

  const progress = duration > 0 ? Math.min(1, current / duration) : 0

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 w-full min-w-[200px] max-w-[min(100%,268px)] py-1",
        isOwn ? "text-primary-foreground" : "text-foreground"
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95",
          isOwn
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
            : "bg-primary/15 text-primary hover:bg-primary/25"
        )}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 ml-0.5 fill-current" />
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "relative h-1.5 w-full rounded-full cursor-pointer",
            isOwn ? "bg-primary-foreground/25" : "bg-primary/15"
          )}
          onClick={seek}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              toggle()
            }
          }}
        >
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-100",
              isOwn ? "bg-primary-foreground/90" : "bg-primary"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex flex-1 min-w-0 items-end justify-start gap-0.5 h-4 opacity-90"
            aria-hidden
          >
            {[4, 7, 5, 9, 4, 8, 6, 7, 5, 9, 4, 6, 8, 5, 4, 7].map((px, i) => (
              <span
                key={i}
                className={cn(
                  "w-[2.5px] shrink-0 rounded-full",
                  isOwn ? "bg-primary-foreground/45" : "bg-primary/40"
                )}
                style={{ height: px }}
              />
            ))}
          </div>
          <span
            className={cn(
              "font-data text-[11px] tabular-nums shrink-0",
              isOwn ? "text-primary-foreground/85" : "text-muted-foreground"
            )}
          >
            {formatDur(playing ? current : duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
