import { Platform } from "react-native"
import { isRunningInExpoGo } from "expo"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type * as ExpoNotifications from "expo-notifications"

const PREF_KEY = "jobmatch-push-opt-in"
const CHANNEL = "pings"

let activeConversationId: string | null = null
let cached: typeof ExpoNotifications | null | undefined

export const pushAvailable = !(isRunningInExpoGo() && Platform.OS === "android")

export function getNotifications() {
  if (!pushAvailable) return null
  if (cached !== undefined) return cached
  try {
    cached = require("expo-notifications") as typeof ExpoNotifications
  } catch {
    cached = null
  }
  return cached
}

const Notifications = getNotifications()

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function setActiveConversation(id: string | null) {
  activeConversationId = id
}

export function getActiveConversation() {
  return activeConversationId
}

export async function getPushEnabled() {
  return (await AsyncStorage.getItem(PREF_KEY)) === "1"
}

export async function enablePush() {
  const api = getNotifications()
  if (!api) return false
  const { status } = await api.requestPermissionsAsync()
  if (status !== "granted") return false
  if (Platform.OS === "android") {
    await api.setNotificationChannelAsync(CHANNEL, {
      name: "Pings",
      importance: api.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 80, 180],
    })
  }
  await AsyncStorage.setItem(PREF_KEY, "1")
  return true
}

export async function presentPing(opts: {
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  const api = getNotifications()
  if (!api) return
  const on = await getPushEnabled()
  if (!on) return
  const conversationId = typeof opts.data?.conversation_id === "string" ? opts.data.conversation_id : null
  if (conversationId && conversationId === activeConversationId) return
  await api.scheduleNotificationAsync({
    content: {
      title: opts.title || "JobMatch",
      body: opts.body || "",
      data: opts.data ?? {},
      sound: true,
      ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}),
    },
    trigger: null,
  })
}

export function hrefFromPingData(data: Record<string, unknown> | undefined | null, type?: string) {
  const payload = data && typeof data === "object" ? data : {}
  const conversationId = typeof payload.conversation_id === "string" ? payload.conversation_id : null
  const jobId = typeof payload.job_id === "string" ? payload.job_id : null
  const studentId = typeof payload.student_id === "string" ? payload.student_id : null
  if (conversationId) return `/chat/${conversationId}`
  if (studentId) return `/candidate/${studentId}`
  if (jobId) return `/job/${jobId}`
  if (type === "new_jobs_digest") return "/discover"
  return "/notifications"
}
