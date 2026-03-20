"use client"

import { useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Video, Upload, Mic, Trash2, Loader2, X } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"

const BUCKET = "profile-videos"
const MAX_FILE_MB = 50
const MAX_DURATION_MS = 120_000 // 2 min

interface ProfileVideoSectionProps {
  userId: string
  profileVideoUrl: string | null
  onUpdate: (url: string | null) => void
}

export function ProfileVideoSection({ userId, profileVideoUrl, onUpdate }: ProfileVideoSectionProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const supabase = createClient()

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max ${MAX_FILE_MB}MB`, variant: "destructive" })
      return
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
    const path = `${userId}/video.${ext}`
    setUploading(true)
    try {
      await supabase.storage.from(BUCKET).remove([`${userId}/video.mp4`, `${userId}/video.webm`, `${userId}/video.mov`])
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type,
      })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const url = `${urlData.publicUrl}?t=${Date.now()}`
      const { error: updateError } = await supabase.from("profiles").update({ profile_video_url: url }).eq("id", userId)
      if (updateError) throw updateError
      onUpdate(url)
      toast({ title: "Video updated", description: "Your profile video is live." })
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Try again", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }, [userId, supabase, onUpdate, toast])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      setPreviewUrl(null)
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        // iOS/Safari sometimes requires muted for autoplay
        videoPreviewRef.current.muted = true
        await videoPreviewRef.current.play().catch(() => {})
      }
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null
        }
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
        const file = new File([blob], "recording.webm", { type: "video/webm" })
        await uploadFile(file)
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setRecording(true)
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop()
          setRecording(false)
          setShowRecordModal(false)
        }
      }, MAX_DURATION_MS)
    } catch (e: any) {
      toast({ title: "Camera/mic required", description: e?.message || "Allow access to record", variant: "destructive" })
    }
  }, [uploadFile, toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
      setRecording(false)
      setShowRecordModal(false)
      // Tracks will be stopped in recorder.onstop
    }
  }, [])

  const removeVideo = useCallback(async () => {
    setUploading(true)
    try {
      await supabase.storage.from(BUCKET).remove([`${userId}/video.mp4`, `${userId}/video.webm`, `${userId}/video.mov`])
      await supabase.from("profiles").update({ profile_video_url: null }).eq("id", userId)
      onUpdate(null)
      toast({ title: "Video removed" })
    } catch (e: any) {
      toast({ title: "Could not remove video", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }, [userId, supabase, onUpdate, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  return (
    <>
      <div className="rounded-2xl bg-white border border-black/10 overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-black/10">
          <Video className="h-4 w-4 text-neutral-900" />
          <h3 className="font-data text-[11px] tracking-widest uppercase text-neutral-700">Profile Video</h3>
        </div>
        <div className="p-4 space-y-4">
          {profileVideoUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-white aspect-video max-h-[280px]">
              <video
                src={profileVideoUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-black text-xs font-body backdrop-blur-sm"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Replace
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-neutral-500 text-xs font-body backdrop-blur-sm"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] aspect-video max-h-[200px] flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 flex items-center justify-center">
                <Video className="h-6 w-6 text-neutral-900" />
              </div>
              <p className="font-body text-sm text-neutral-700 text-center">
                Add a short intro video so recruiters can get to know you
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA]/15 border border-[#FAFAFA]/30 text-neutral-900 font-body text-sm font-medium cursor-pointer hover:bg-[#FAFAFA]/25 transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload video
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(true)}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-black/10 text-black font-body text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Mic className="h-4 w-4" /> Record video
                </button>
              </div>
            </div>
          )}

          {!profileVideoUrl && (
            <p className="font-data text-[10px] text-neutral-700">
              Max {MAX_FILE_MB}MB · MP4, WebM or MOV · Up to 2 min recommended
            </p>
          )}
        </div>
      </div>

      {/* Upload modal: hidden file input is enough; we can add a drag-drop modal later if needed */}

      {/* Record modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 backdrop-blur-sm">
          <div className="rounded-2xl bg-white border border-black/10 w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-black/10 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-black">Record your video</h3>
              <button
                type="button"
                onClick={() => { stopRecording(); setShowRecordModal(false) }}
                className="p-2 rounded-lg hover:bg-white/10 text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="font-body text-sm text-neutral-700">
                {recording ? "Recording… (max 2 min). Click Stop when done." : "Allow camera and microphone, then click Start to record."}
              </p>

              {/* Live preview + post-record preview */}
              <div className="rounded-xl overflow-hidden bg-white border border-black/10 aspect-video">
                {previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="flex gap-2">
                {!recording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-body font-semibold"
                  >
                    Start recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 border border-neutral-500/40 text-neutral-500 font-body font-semibold"
                  >
                    Stop & save
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-3 rounded-xl border border-black/10 text-neutral-700 font-body"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
