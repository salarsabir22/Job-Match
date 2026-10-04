import { useMemo, useState } from "react"
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Field } from "@/components/ui"
import { colors } from "@/lib/theme"

export function SearchablePick({
  label,
  value,
  onChange,
  options,
  otherLabel = "Other (type your own)",
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  otherLabel?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? options.filter((o) => o.toLowerCase().includes(q)) : options
    return [...list.slice(0, 80), otherLabel]
  }, [options, otherLabel, query])

  return (
    <View>
      <Pressable onPress={() => setOpen(true)}>
        <Field label={label} value={value} editable={false} placeholder={placeholder || "Search"} />
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{label}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="rgba(0,0,0,0.32)"
            style={styles.search}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item === otherLabel) {
                    onChange(query.trim() || value)
                  } else {
                    onChange(item)
                  }
                  setOpen(false)
                  setQuery("")
                }}
                style={styles.row}
              >
                <Text style={styles.rowLabel}>{item}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setOpen(false)} style={styles.close}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg, paddingTop: 56, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: 12 },
  search: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  row: {
    minHeight: 48,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: { fontSize: 15, color: colors.ink },
  close: { paddingVertical: 16, alignItems: "center" },
  closeLabel: { fontSize: 16, fontWeight: "600", color: colors.navy },
})
