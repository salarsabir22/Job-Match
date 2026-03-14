"use client"

import { useState, useRef, useCallback } from "react"

interface SwipeCardProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeSave?: () => void
  children: React.ReactNode
  disabled?: boolean
}

const SWIPE_THRESHOLD = 90

export function SwipeCard({ onSwipeLeft, onSwipeRight, onSwipeSave, children, disabled }: SwipeCardProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const rotation = Math.min(Math.max(pos.x / 15, -20), 20)
  const likeOpacity = Math.min(pos.x / SWIPE_THRESHOLD, 1)
  const nopeOpacity = Math.min(-pos.x / SWIPE_THRESHOLD, 1)

  const triggerSwipe = useCallback((direction: "left" | "right") => {
    setLeaving(direction)
    setTimeout(() => {
      setLeaving(null)
      setPos({ x: 0, y: 0 })
      if (direction === "right") onSwipeRight()
      else onSwipeLeft()
    }, 350)
  }, [onSwipeLeft, onSwipeRight])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || leaving) return
    setIsDragging(true)
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || leaving) return
    setPos({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y })
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (pos.x > SWIPE_THRESHOLD) triggerSwipe("right")
    else if (pos.x < -SWIPE_THRESHOLD) triggerSwipe("left")
    else setPos({ x: 0, y: 0 })
  }

  const transform = leaving === "right"
    ? `translateX(120vw) rotate(30deg)`
    : leaving === "left"
    ? `translateX(-120vw) rotate(-30deg)`
    : `translateX(${pos.x}px) translateY(${pos.y * 0.3}px) rotate(${rotation}deg)`

  const transition = isDragging ? "none" : leaving ? "transform 0.35s ease" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"

  return (
    <div
      ref={cardRef}
      style={{ transform, transition, touchAction: "none" }}
      className="relative cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Like indicator */}
      <div
        className="absolute top-6 left-5 z-10 border-4 border-green-500 text-green-500 font-black text-xl px-3 py-1 rounded-lg rotate-[-20deg] uppercase pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        Like
      </div>

      {/* Nope indicator */}
      <div
        className="absolute top-6 right-5 z-10 border-4 border-red-500 text-red-500 font-black text-xl px-3 py-1 rounded-lg rotate-[20deg] uppercase pointer-events-none"
        style={{ opacity: nopeOpacity }}
      >
        Nope
      </div>

      {children}
    </div>
  )
}

export function useSwipeControls(onLeft: () => void, onRight: () => void) {
  const triggerLeft = useCallback(() => onLeft(), [onLeft])
  const triggerRight = useCallback(() => onRight(), [onRight])
  return { triggerLeft, triggerRight }
}
