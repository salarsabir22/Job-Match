/** Rich chat payloads stored as JSON in `messages.content` (plain string = legacy text). */

export type ChatPayload =
  | { type: "text"; body: string }
  | { type: "voice"; url: string; durationSec: number }
  | { type: "image"; url: string; width?: number; height?: number }

export function parseChatPayload(content: string): ChatPayload {
  const t = content.trim()
  if (t.startsWith("{")) {
    try {
      const v = JSON.parse(t) as ChatPayload
      if (v && typeof v === "object" && "type" in v) {
        if (v.type === "text" && typeof (v as ChatPayload & { body?: string }).body === "string") {
          return { type: "text", body: (v as { body: string }).body }
        }
        if (v.type === "voice" && typeof (v as { url?: string }).url === "string") {
          return {
            type: "voice",
            url: (v as { url: string }).url,
            durationSec: typeof (v as { durationSec?: number }).durationSec === "number" ? (v as { durationSec: number }).durationSec : 0,
          }
        }
        if (v.type === "image" && typeof (v as { url?: string }).url === "string") {
          return {
            type: "image",
            url: (v as { url: string }).url,
            width: (v as { width?: number }).width,
            height: (v as { height?: number }).height,
          }
        }
      }
    } catch {
      /* fall through */
    }
  }
  return { type: "text", body: content }
}

export function serializeText(body: string): string {
  const b = body.trim()
  if (!b) return ""
  if (b.startsWith("{")) {
    return JSON.stringify({ type: "text", body: b } satisfies ChatPayload)
  }
  return b
}

export function serializeVoice(url: string, durationSec: number): string {
  return JSON.stringify({ type: "voice", url, durationSec } satisfies ChatPayload)
}

export function serializeImage(url: string, width?: number, height?: number): string {
  return JSON.stringify({ type: "image", url, width, height } satisfies ChatPayload)
}
