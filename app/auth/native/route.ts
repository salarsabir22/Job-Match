import { NextResponse } from "next/server"

/** Captured by Expo after Google sign-in. Do not exchange the `code` here — the app does. */
export function GET(request: Request) {
  const incoming = new URL(request.url)
  const qs = incoming.searchParams.toString()
  const deepLink = `jobmatch://auth/callback${qs ? `?${qs}` : ""}`
  const safeHref = deepLink.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
  const jsUrl = JSON.stringify(deepLink)

  return new NextResponse(
    `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0;url=${safeHref}" />
    <title>Opening JobMatch</title>
    <script>try{location.replace(${jsUrl})}catch(e){}</script>
  </head>
  <body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#050506;color:#fff;font-family:system-ui,sans-serif">
    <p>Returning to JobMatch…</p>
    <a href="${safeHref}" style="color:#fff">Open JobMatch</a>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  )
}
