import { StreamChat } from "stream-chat"

let streamServerClient: StreamChat | null = null

export function getStreamServerClient() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY
  const apiSecret = process.env.STREAM_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error("Stream is not configured. Missing NEXT_PUBLIC_STREAM_API_KEY or STREAM_API_SECRET.")
  }

  if (!streamServerClient) {
    streamServerClient = StreamChat.getInstance(apiKey, apiSecret)
  }

  return streamServerClient
}

export function isStreamConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_STREAM_API_KEY && process.env.STREAM_API_SECRET)
}
