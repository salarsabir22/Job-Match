export const MAX_VOICE_SECONDS = 60

export function formatVoiceClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, "0")}`
}

export function voiceBars(seed: string, count = 22) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const n = ((h >>> 0) % 1000) / 1000
    const env = 0.28 + 0.72 * Math.sin((i / Math.max(1, count - 1)) * Math.PI)
    return 0.16 + n * 0.84 * env
  })
}
