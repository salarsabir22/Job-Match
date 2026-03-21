/**
 * Publishable keys (`sb_publishable_...`) are not JWTs. supabase-js uses the
 * project key as `Authorization: Bearer <key>` when there is no user session;
 * PostgREST then returns 401 (often surfaced with a misleading RLS message).
 *
 * Hosted Supabase authenticates REST via `apikey` and mints a JWT for Postgres.
 * We only adjust **PostgREST** (`/rest/v1`) requests so Auth/Storage keep their
 * usual headers. Logged-in users still send `eyJ...` session JWTs in Bearer.
 *
 * @see https://supabase.com/docs/guides/api/api-keys#known-limitations-and-compatibility-differences
 */
export function createSupabaseFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const req = new Request(input, init)
    const url = new URL(req.url)
    if (!url.pathname.includes("/rest/v1")) {
      return baseFetch(req)
    }

    const auth = req.headers.get("authorization")
    if (auth?.toLowerCase().startsWith("bearer ")) {
      const token = auth.slice(7).trim()
      if (token && !token.startsWith("eyJ")) {
        const headers = new Headers(req.headers)
        headers.delete("authorization")
        return baseFetch(new Request(req, { headers }))
      }
    }
    return baseFetch(req)
  }
}
