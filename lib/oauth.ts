import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import * as QueryParams from "expo-auth-session/build/QueryParams"
import { supabase } from "@/lib/supabase"

WebBrowser.maybeCompleteAuthSession()

export const authRedirect = "jobmatch://auth/callback"

function isAuthCallbackUrl(url: string) {
  return url.includes("code=") || url.includes("access_token")
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url)
  if (errorCode) throw new Error(errorCode)
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (!error) return data.session
    const existing = await supabase.auth.getSession()
    if (existing.data.session) return existing.data.session
    throw error
  }
  const access_token = params.access_token
  const refresh_token = params.refresh_token
  if (!access_token) return null
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) throw error
  return data.session
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authRedirect,
      skipBrowserRedirect: true,
    },
  })
  if (error || !data.url) throw error ?? new Error("Google sign-in failed.")

  let sub: { remove: () => void } | undefined
  const linked = new Promise<string>((resolve) => {
    sub = Linking.addEventListener("url", ({ url }) => {
      if (!isAuthCallbackUrl(url)) return
      resolve(url)
    })
  })

  try {
    const browser = WebBrowser.openAuthSessionAsync(data.url, authRedirect).then((result) => {
      if (result.type === "success" && result.url && isAuthCallbackUrl(result.url)) return result.url
      return null
    })
    const returned = await Promise.race([linked, browser])
    if (!returned) return null
    try {
      WebBrowser.dismissAuthSession()
    } catch {
      /* already closed */
    }
    return createSessionFromUrl(returned)
  } finally {
    sub?.remove()
  }
}
