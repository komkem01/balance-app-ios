import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
};

export function AppButton({ label, onPress, disabled, loading, variant = "primary" }: AppButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <View style={styles.loader} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  ghost: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontFamily: "Manrope_700Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
  },
  labelPrimary: {
    color: theme.colors.white,
  },
  labelGhost: {
    color: theme.colors.textPrimary,
    textTransform: "none",
    letterSpacing: 0.2,
    fontSize: 13,
  },
  loader: {
    width: 16,
    height: 16,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    borderTopColor: theme.colors.white,
  },
});
