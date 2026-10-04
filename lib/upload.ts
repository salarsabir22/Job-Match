import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import { supabase } from "@/lib/supabase"

export async function uploadUri(opts: {
  bucket: string
  path: string
  uri: string
  contentType: string
}) {
  const res = await fetch(opts.uri)
  const buf = await res.arrayBuffer()
  const { error } = await supabase.storage.from(opts.bucket).upload(opts.path, buf, {
    contentType: opts.contentType,
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(opts.path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith("http")) return path
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error) return null
  return data.signedUrl
}

export async function pickImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) throw new Error("Photo library permission is required.")
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.82,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "image/jpeg",
    name: asset.fileName || "photo.jpg",
  }
}

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "application/pdf",
    name: asset.name || "resume.pdf",
  }
}

export function extFromType(contentType: string, fallback: string) {
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("gif")) return "gif"
  if (contentType.includes("pdf")) return "pdf"
  if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return "docx"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg"
  if (contentType.includes("mp4") || contentType.includes("quicktime")) return "mp4"
  if (contentType.includes("m4a") || contentType.includes("mp4a") || contentType.includes("aac")) return "m4a"
  if (contentType.includes("mpeg") || contentType.includes("mp3")) return "mp3"
  return fallback
}

export async function pickCamera() {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) throw new Error("Camera permission is required.")
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.82,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "image/jpeg",
    name: asset.fileName || "camera.jpg",
  }
}

export async function pickAnyFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "application/octet-stream",
    name: asset.name || "file",
  }
}

export async function pickAudioFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["audio/*"],
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "audio/mpeg",
    name: asset.name || "audio.mp3",
  }
}

export async function pickVideo() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) throw new Error("Photo library permission is required.")
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    quality: 0.7,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    contentType: asset.mimeType || "video/mp4",
    name: asset.fileName || "intro.mp4",
  }
}
