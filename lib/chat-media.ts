export function classifyChatMedia(opts: {
  messageType?: string | null
  mimeType?: string | null
  fileName?: string | null
  content?: string | null
}): "image" | "video" | "audio" | "voice" | "file" | "text" {
  const type = opts.messageType
  if (type === "voice") return "voice"
  if (type === "image" || type === "video" || type === "audio" || type === "file") return type
  const mime = (opts.mimeType || "").toLowerCase()
  const name = (opts.fileName || opts.content || "").toLowerCase()
  if (mime.startsWith("image/") || /\.(gif|jpe?g|png|webp|heic|heif)$/.test(name)) return "image"
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/.test(name)) return "video"
  if (mime.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac)$/.test(name)) return "audio"
  if (opts.messageType === "text" || !opts.messageType) return "text"
  return "file"
}

export function classifyByMime(contentType: string, name = ""): "image" | "video" | "audio" | "file" {
  const mime = contentType.toLowerCase()
  const lower = name.toLowerCase()
  if (mime.startsWith("image/") || /\.(gif|jpe?g|png|webp)$/.test(lower)) return "image"
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/.test(lower)) return "video"
  if (mime.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|aac)$/.test(lower)) return "audio"
  return "file"
}

export function sanitizeChatFileName(name: string) {
  const trimmed = name.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "")
  return trimmed.slice(0, 120) || "file"
}

export function isGenericCaption(content: string | null | undefined) {
  const c = content?.trim() ?? ""
  return !c || ["Photo", "Video", "Audio", "Voice message", "File", "📷"].includes(c)
}
