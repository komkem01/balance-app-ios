import { StyleSheet, Text, TextInput, View } from "react-native";

import { theme } from "../theme";

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
};

export function AppInput({ label, value, onChangeText, placeholder, secureTextEntry }: AppInputProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSubtle}
        autoCapitalize="none"
        secureTextEntry={secureTextEntry}
      />
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
  input: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.68)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 16,
    fontFamily: "Manrope_500Medium",
    color: theme.colors.textPrimary,
    fontSize: theme.type.body,
  },
});
