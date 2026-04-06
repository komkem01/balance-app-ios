import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { AppScreen } from "../components/AppScreen";
import { SectionTitle } from "../components/SectionTitle";
import { theme } from "../theme";

type Locale = "en" | "th";

type LoginScreenProps = {
  locale: Locale;
  onLocaleChange: (value: Locale) => void;
  username: string;
  password: string;
  remember: boolean;
  loading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onSubmit: () => void;
  onGoRegister: () => void;
};

const copy = {
  en: {
    language: "Language",
    tagline: "Wealth Archive",
    username: "Identification",
    usernamePlaceholder: "Username",
    password: "Security Key",
    remember: "Keep me signed in",
    login: "Login",
    continueWithGoogle: "Continue with Google",
    registerPrompt: "New to the system?",
    register: "Register",
    operational: "System Operational",
  },
  th: {
    language: "ภาษา",
    tagline: "คลังความมั่งคั่ง",
    username: "ชื่อผู้ใช้งาน",
    usernamePlaceholder: "กรอกชื่อผู้ใช้งาน",
    password: "รหัสผ่าน",
    remember: "จดจำการเข้าสู่ระบบ",
    login: "เข้าสู่ระบบ",
    continueWithGoogle: "เข้าสู่ระบบด้วย Google",
    registerPrompt: "ยังไม่มีบัญชี?",
    register: "สมัครสมาชิก",
    operational: "ระบบพร้อมใช้งาน",
  },
};

export function LoginScreen(props: LoginScreenProps) {
  const t = useMemo(() => copy[props.locale], [props.locale]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppCard style={styles.loginCard}>
          <View style={styles.languageRow}>
            <Text style={styles.languageLabel}>{t.language}</Text>
            <View style={styles.languageSwitch}>
              <Pressable style={[styles.localeBtn, props.locale === "en" && styles.localeActive]} onPress={() => props.onLocaleChange("en")}>
                <Text style={[styles.localeText, props.locale === "en" && styles.localeTextActive]}>EN</Text>
              </Pressable>
              <Pressable style={[styles.localeBtn, props.locale === "th" && styles.localeActive]} onPress={() => props.onLocaleChange("th")}>
                <Text style={[styles.localeText, props.locale === "th" && styles.localeTextActive]}>TH</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.hero}>
            <SectionTitle eyebrow={t.tagline} title="BALANCE" />
          </View>

          <View style={styles.form}>
            <AppInput
              label={t.username}
              value={props.username}
              onChangeText={props.onUsernameChange}
              placeholder={t.usernamePlaceholder}
            />
            <AppInput
              label={t.password}
              value={props.password}
              onChangeText={props.onPasswordChange}
              placeholder="........"
              secureTextEntry
            />

            <Pressable style={styles.rememberRow} onPress={() => props.onRememberChange(!props.remember)}>
              <View style={[styles.check, props.remember && styles.checkActive]} />
              <Text style={styles.rememberText}>{t.remember}</Text>
            </Pressable>

            <View style={styles.actions}>
              <AppButton label={t.login} onPress={props.onSubmit} loading={props.loading} />
              <AppButton label={t.continueWithGoogle} onPress={() => {}} variant="ghost" />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>{t.registerPrompt}</Text>
              <Pressable onPress={props.onGoRegister}>
                <Text style={styles.registerLink}>{t.register}</Text>
              </Pressable>
            </View>
          </View>
        </AppCard>

        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>{t.operational}</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
  },
  loginCard: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  languageLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  languageSwitch: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 2,
  },
  localeBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  localeActive: {
    backgroundColor: theme.colors.primary,
  },
  localeText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  localeTextActive: {
    color: theme.colors.white,
  },
  hero: {
    marginBottom: theme.spacing.xxl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  check: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
  },
  checkActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  rememberText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  registerRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  registerPrompt: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  registerLink: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.15)",
    paddingBottom: 1,
  },
  statusRow: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.emerald,
  },
  statusText: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
});
