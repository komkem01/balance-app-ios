import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { theme } from "../theme";

type AppScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function AppScreen({ children, padded = true }: AppScreenProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.colors.bgBase, "#eef2ff", "#f8fafc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.meshContainer} pointerEvents="none">
        <View style={[styles.orb, styles.orbTopLeft]} />
        <View style={[styles.orb, styles.orbTopRight]} />
        <View style={[styles.orb, styles.orbBottomRight]} />
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, padded && styles.padded]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  meshContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: theme.radius.pill,
    opacity: 0.18,
  },
  orbTopLeft: {
    left: -80,
    top: -70,
    backgroundColor: theme.colors.indigo,
  },
  orbTopRight: {
    right: -90,
    top: -40,
    backgroundColor: "#a78bfa",
  },
  orbBottomRight: {
    right: -100,
    bottom: -70,
    backgroundColor: "#c7d2fe",
  },
});
