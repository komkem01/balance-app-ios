import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";

import { theme } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SidebarScreen = "dashboard" | "transactions" | "profile" | "quick-entry";
type SidebarSectionKey = "overview" | "management" | "actions" | "system";
type SidebarIcon = "grid" | "clock" | "credit-card" | "tag" | "pie-chart" | "plus-circle" | "user" | "settings";
type SidebarMenuItem = {
  key: string;
  label: string;
  icon: SidebarIcon;
  screen?: SidebarScreen;
  comingSoon?: boolean;
};

type AppSidebarProps = {
  visible: boolean;
  currentScreen: SidebarScreen;
  userDisplayName: string;
  onClose: () => void;
  onNavigate: (screen: SidebarScreen) => void;
  onComingSoon: (label: string) => void;
  onLogout: () => void;
};

const sectionItems: Array<{ key: SidebarSectionKey; title: string; items: SidebarMenuItem[] }> = [
  {
    key: "overview",
    title: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "grid", screen: "dashboard" },
      { key: "transactions", label: "Transaction Ledger", icon: "clock", screen: "transactions" },
    ],
  },
  {
    key: "management",
    title: "Management",
    items: [
      { key: "wallets", label: "Wallets", icon: "credit-card", comingSoon: true },
      { key: "categories", label: "Categories", icon: "tag", comingSoon: true },
      { key: "budgets", label: "Budgets", icon: "pie-chart", comingSoon: true },
    ],
  },
  {
    key: "actions",
    title: "Entry",
    items: [{ key: "quick-entry", label: "Quick Entry", icon: "plus-circle", screen: "quick-entry" }],
  },
  {
    key: "system",
    title: "System",
    items: [
      { key: "profile", label: "Account Profile", icon: "user", screen: "profile" },
      { key: "settings", label: "Settings", icon: "settings", comingSoon: true },
    ],
  },
];

export function AppSidebar({ visible, currentScreen, userDisplayName, onClose, onNavigate, onComingSoon, onLogout }: AppSidebarProps) {
  const { width } = useWindowDimensions();
  const [sections, setSections] = useState<Record<SidebarSectionKey, boolean>>({
    overview: true,
    management: true,
    actions: false,
    system: false,
  });
  const [hoveredSection, setHoveredSection] = useState<SidebarSectionKey | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const panelWidth = useMemo(() => {
    if (width >= 1025) {
      return 288;
    }
    if (width >= 768) {
      return Math.min(360, Math.round(width * 0.48));
    }
    return Math.min(320, Math.round(width * 0.84));
  }, [width]);

  const toggleSection = (section: SidebarSectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isCompact = width < 1025;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.panel, { width: panelWidth }]}>
          <View style={styles.brandWrap}>
            {isCompact ? (
              <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
                <Feather name="x" size={15} color={theme.colors.textMuted} />
              </Pressable>
            ) : null}
            <Text style={styles.brandEyebrow}>Archive</Text>
            <Text style={styles.brandTitle}>Balance</Text>
          </View>

          <View style={styles.navContainer}>
            {sectionItems.map((section) => (
              <View key={section.key} style={styles.navGroup}>
                <Pressable
                  onPress={() => toggleSection(section.key)}
                  onHoverIn={() => setHoveredSection(section.key)}
                  onHoverOut={() => {
                    setHoveredSection((prev) => (prev === section.key ? null : prev));
                  }}
                  style={({ pressed }) => [
                    styles.sectionTrigger,
                    hoveredSection === section.key && styles.sectionTriggerHover,
                    pressed && styles.sectionTriggerPressed,
                  ]}
                >
                  <Text style={styles.navLabel}>{section.title}</Text>
                  <Feather name="chevron-down" size={14} color={theme.colors.textSubtle} style={!sections[section.key] ? styles.chevronCollapsed : null} />
                </Pressable>

                {sections[section.key] ? (
                  <View style={styles.sectionBody}>
                    {section.items.map((item) => {
                      const active = item.screen === currentScreen;

                      return (
                        <Pressable
                          key={item.key}
                          onPress={() => {
                            if (item.screen) {
                              onNavigate(item.screen);
                              onClose();
                              return;
                            }

                            onComingSoon(item.label);
                            onClose();
                          }}
                          onHoverIn={() => setHoveredItem(item.key)}
                          onHoverOut={() => {
                            setHoveredItem((prev) => (prev === item.key ? null : prev));
                          }}
                          style={({ pressed }) => [
                            styles.navItem,
                            active && styles.navItemActive,
                            hoveredItem === item.key && styles.navItemHover,
                            pressed && styles.navItemPressed,
                          ]}
                        >
                          <View style={styles.navItemInner}>
                            <Feather name={item.icon} size={14} color={active ? theme.colors.textPrimary : theme.colors.textSubtle} style={styles.navIcon} />
                            <Text style={[styles.navItemText, active && styles.navItemTextActive]}>{item.label}</Text>
                          </View>
                          {item.comingSoon ? <Text style={styles.tagSoon}>Soon</Text> : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.authLabel}>Authenticated as</Text>
            <Text style={styles.authUser}>{userDisplayName || "Member"}</Text>
            <Pressable onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderSoft,
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  brandWrap: {
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  closeButton: {
    position: "absolute",
    top: -20,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  closeButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  brandEyebrow: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  brandTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_300Light",
    fontSize: 33,
    letterSpacing: -0.7,
    textTransform: "uppercase",
  },
  navContainer: {
    flex: 1,
    paddingTop: 6,
  },
  navGroup: {
    marginBottom: 8,
  },
  sectionTrigger: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTriggerHover: {
    backgroundColor: "rgba(15, 23, 42, 0.04)",
  },
  sectionTriggerPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  navLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  chevronCollapsed: {
    transform: [{ rotate: "-90deg" }],
  },
  sectionBody: {
    marginLeft: 18,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.borderSoft,
    paddingLeft: 8,
    gap: 4,
  },
  navItem: {
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navItemInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navIcon: {
    width: 16,
  },
  navItemActive: {
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
  navItemHover: {
    backgroundColor: "rgba(15, 23, 42, 0.05)",
  },
  navItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  navItemText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  navItemTextActive: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
  },
  tagSoon: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  footer: {
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  authLabel: {
    color: "#94a3b8",
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  authUser: {
    color: theme.colors.white,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
  },
  logoutBtn: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  logoutText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
