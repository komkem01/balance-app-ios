import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

type SectionTitleProps = {
  eyebrow: string;
  title: string;
};

export function SectionTitle({ eyebrow, title }: SectionTitleProps) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 4,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_300Light",
    fontSize: theme.type.heading,
    letterSpacing: -0.8,
  },
});
