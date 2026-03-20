"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/lib/hooks/use-toast"
import { Hash, Plus, Trash2, Users, Loader2, Zap, X } from "lucide-react"

export default function AdminChannelsPage() {
  const { toast } = useToast()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")

  const inputClass = "w-full h-11 px-4 rounded-xl bg-white border border-black/10 text-black text-sm placeholder:text-black/25 focus:outline-none focus:border-[#FAFAFA]/60 transition-all duration-200"
  const textareaClass = "w-full px-4 py-3 rounded-xl bg-white border border-black/10 text-black text-sm placeholder:text-black/25 focus:outline-none focus:border-[#FAFAFA]/60 transition-all duration-200 resize-none"
  const labelClass = "block font-data text-[11px] tracking-wider uppercase text-neutral-700 mb-1.5"

  useEffect(() => { loadChannels() }, [])

  const loadChannels = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("community_channels").select("*, channel_members(user_id)").order("name")
    setChannels(data || [])
    setLoading(false)
  }

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("community_channels").insert({
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || null,
      category: category || null,
      created_by: user!.id,
    })
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }) }
    else { toast({ title: "Channel created!" }); setName(""); setDescription(""); setCategory("general"); setOpen(false); loadChannels() }
    setCreating(false)
  }

  const deleteChannel = async (id: string) => {
    if (!confirm("Delete this channel? All messages will be lost.")) return
    const supabase = createClient()
    const { error } = await supabase.from("community_channels").delete().eq("id", id)
    if (error) { toast({ variant: "destructive", title: "Error", description: error.message }) }
    else { toast({ title: "Channel deleted" }); setChannels(prev => prev.filter(c => c.id !== id)) }
  }

  return (
    <div className="space-y-5 p-4 max-w-4xl bg-white min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-black">Community Channels</h1>
          <p className="font-data text-[11px] tracking-wider uppercase text-neutral-700 mt-0.5">{channels.length} channels</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white font-body font-semibold text-xs shadow-[0_0_15px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.7)] transition-all duration-300">
          <Plus className="h-3.5 w-3.5" />New Channel
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-6 shadow-[0_0_50px_-10px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-lg text-black">Create Channel</h2>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/5 border border-black/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-neutral-700" />
              </button>
            </div>
            <form onSubmit={createChannel} className="space-y-4">
              <div>
                <label className={labelClass}>Channel Name</label>
                <input className={inputClass} placeholder="e.g. data-science" value={name} onChange={(e) => setName(e.target.value)} required />
                <p className="font-data text-[10px] text-neutral-700 mt-1">Spaces will be replaced with hyphens</p>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea className={textareaClass} placeholder="What is this channel about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input className={inputClass} placeholder="e.g. tech, career, networking" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
              <button type="submit" disabled={creating}
                className="w-full h-11 rounded-xl bg-black text-white font-body font-semibold text-sm shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.7)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Channel"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse shadow-[0_0_20px_-3px_rgba(255,255,255,0.6)]">
            <Zap className="h-5 w-5 text-black" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-black/10">
              <div className="h-10 w-10 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center shrink-0">
                <Hash className="h-5 w-5 text-neutral-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold text-sm text-black">#{ch.name}</p>
                  {ch.category && (
                    <span className="font-data text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-white/5 border border-black/10 text-neutral-700">
                      {ch.category}
                    </span>
                  )}
                </div>
                {ch.description && <p className="font-body text-xs text-neutral-700 truncate">{ch.description}</p>}
                <p className="font-data text-[10px] text-neutral-700 flex items-center gap-1 mt-0.5">
                  <Users className="h-3 w-3" />{ch.channel_members?.length || 0} members
                </p>
              </div>
              <button onClick={() => deleteChannel(ch.id)}
                className="w-8 h-8 rounded-lg border border-neutral-500/20 text-neutral-500 flex items-center justify-center hover:bg-red-500/10 hover:border-neutral-500/40 transition-all duration-200 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
