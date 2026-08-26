"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function FeedbackPage() {
  const { toast } = useToast()
  const [liked, setLiked] = useState("")
  const [disliked, setDisliked] = useState("")
  const [improve, setImprove] = useState("")
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!liked.trim() && !disliked.trim() && !improve.trim()) {
      toast({ variant: "destructive", title: "Write something first", description: "Even a vibe check counts." })
      return
    }
    setSending(true)
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) {
      setSending(false)
      return
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    const { error } = await supabase.from("product_feedback").insert({
      user_id: user.id,
      role: profile?.role ?? null,
      liked: liked.trim() || null,
      disliked: disliked.trim() || null,
      improve: improve.trim() || null,
    })
    setSending(false)
    if (error) {
      toast({ variant: "destructive", title: "Could not send", description: error.message })
      return
    }
    setLiked("")
    setDisliked("")
    setImprove("")
    toast({ title: "Got it 💌", description: "Thanks for keeping us honest." })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Spill the tea</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Feedback</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Built by gen-z, for gen-z. If something slaps or slaps you in the face, say it.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">What do you think?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="liked">What you like 💚</Label>
              <Textarea
                id="liked"
                className="min-h-[88px] rounded-xl"
                placeholder="The swipe feed, the chat, the whole vibe…"
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disliked">What you dislike 🫠</Label>
              <Textarea
                id="disliked"
                className="min-h-[88px] rounded-xl"
                placeholder="Be honest. We can take it."
                value={disliked}
                onChange={(e) => setDisliked(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improve">What we should cook next 🔥</Label>
              <Textarea
                id="improve"
                className="min-h-[88px] rounded-xl"
                placeholder="Features, copy, bugs, random ideas…"
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full" disabled={sending}>
              {sending ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
