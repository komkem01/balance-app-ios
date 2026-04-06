import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

type SelectOption = {
  label: string;
  value: string;
};

type AppSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function AppSelect({ label, placeholder, value, options, onChange, invalid }: AppSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.trigger, invalid && styles.triggerInvalid]} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>{selected?.label || placeholder}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.list}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: theme.spacing.sm,
  },
  label: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: theme.type.label,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  trigger: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.68)",
    paddingHorizontal: theme.spacing.lg,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  triggerInvalid: {
    borderColor: theme.colors.rose,
  },
  triggerText: {
    fontFamily: "Manrope_500Medium",
    color: theme.colors.textPrimary,
    fontSize: theme.type.body,
  },
  placeholder: {
    color: theme.colors.textSubtle,
  },
  chevron: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    maxHeight: 380,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
  },
  sheetTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    marginBottom: theme.spacing.sm,
  },
  list: {
    maxHeight: 290,
  },
  option: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  optionActive: {
    backgroundColor: theme.colors.bgSoft,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
  optionTextActive: {
    fontFamily: "Manrope_700Bold",
  },
});
