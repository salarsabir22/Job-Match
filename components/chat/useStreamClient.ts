"use client"

import { useEffect, useState } from "react"
import { StreamChat } from "stream-chat"

type TokenResponse = {
  token: string
  apiKey: string
  user: { id: string; name: string; image?: string }
}

export function useStreamClient() {
  const [client, setClient] = useState<StreamChat | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    let instance: StreamChat | null = null

    const init = async () => {
      try {
        const tokenRes = await fetch("/api/stream/token", { method: "POST" })
        const tokenData = (await tokenRes.json()) as TokenResponse | { error?: string }
        if (!tokenRes.ok || !("token" in tokenData) || !tokenData.token || !tokenData.apiKey) {
          throw new Error(("error" in tokenData && tokenData.error) || "Could not initialize chat.")
        }

        instance = StreamChat.getInstance(tokenData.apiKey)
        await instance.connectUser(tokenData.user, tokenData.token)
        if (!disposed) setClient(instance)
      } catch (e) {
        if (disposed) return
        setError(e instanceof Error ? e.message : "Unable to load chat.")
      }
    }

    void init()

    return () => {
      disposed = true
      if (instance) void instance.disconnectUser()
    }
  }, [])

  return { client, error }
}
