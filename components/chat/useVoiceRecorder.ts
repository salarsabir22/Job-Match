"use client"

import { useCallback, useRef, useState } from "react"

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [durationSec, setDurationSec] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)

  const stopTracks = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((t) => t.stop())
  }, [])

  const start = useCallback(async () => {
    if (recording) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"
    const rec = new MediaRecorder(stream, { mimeType: mime })
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    rec.start(200)
    mediaRef.current = rec
    startedAt.current = Date.now()
    setDurationSec(0)
    tickRef.current = setInterval(() => {
      setDurationSec(Math.round((Date.now() - startedAt.current) / 1000))
    }, 500)
    setRecording(true)
  }, [recording])

  const stop = useCallback((): Promise<{ blob: Blob; durationSec: number } | null> => {
    return new Promise((resolve) => {
      const rec = mediaRef.current
      if (!rec || rec.state === "inactive") {
        setRecording(false)
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = null
        resolve(null)
        return
      }
      const stream = rec.stream
      rec.onstop = () => {
        if (tickRef.current) clearInterval(tickRef.current)
        tickRef.current = null
        setRecording(false)
        const dur = Math.max(0.5, Math.round((Date.now() - startedAt.current) / 1000))
        const type = chunksRef.current[0]?.type || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        chunksRef.current = []
        mediaRef.current = null
        stopTracks(stream)
        resolve({ blob, durationSec: dur })
      }
      rec.stop()
    })
  }, [stopTracks])

  const cancel = useCallback(() => {
    const rec = mediaRef.current
    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        chunksRef.current = []
        mediaRef.current = null
        stopTracks(rec.stream)
      }
      rec.stop()
    }
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
    setRecording(false)
    setDurationSec(0)
  }, [stopTracks])

  return { recording, durationSec, start, stop, cancel }
}
