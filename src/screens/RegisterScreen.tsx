import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { AppScreen } from "../components/AppScreen";
import { AppSelect } from "../components/AppSelect";
import { SectionTitle } from "../components/SectionTitle";
import { theme } from "../theme";

type Locale = "en" | "th";

type RegisterScreenProps = {
  locale: Locale;
  prefix: string;
  gender: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPrefixChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onBackToLogin: () => void;
  onSubmit: () => void;
};

const copy = {
  en: {
    tagline: "Wealth Archive",
    prefix: "Prefix",
    prefixPlaceholder: "Select prefix",
    gender: "Gender",
    genderPlaceholder: "Select gender",
    selectionRequired: "Please select prefix and gender before creating your account",
    firstName: "First Name",
    lastName: "Last Name",
    username: "Username",
    password: "Password",
    confirmPassword: "Confirm Password",
    createAccount: "Create Account",
    backToLogin: "Back to Login",
  },
  th: {
    tagline: "คลังความมั่งคั่ง",
    prefix: "คำนำหน้า",
    prefixPlaceholder: "เลือกคำนำหน้า",
    gender: "เพศ",
    genderPlaceholder: "เลือกเพศ",
    selectionRequired: "กรุณาเลือกคำนำหน้าและเพศก่อนสร้างบัญชี",
    firstName: "ชื่อ",
    lastName: "นามสกุล",
    username: "ชื่อผู้ใช้งาน",
    password: "รหัสผ่าน",
    confirmPassword: "ยืนยันรหัสผ่าน",
    createAccount: "สร้างบัญชี",
    backToLogin: "กลับหน้าเข้าสู่ระบบ",
  },
};

export function RegisterScreen(props: RegisterScreenProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const t = useMemo(() => copy[props.locale], [props.locale]);
  const prefixOptions = useMemo(
    () =>
      props.locale === "th"
        ? [
            { label: "นาย", value: "mr" },
            { label: "นาง", value: "mrs" },
            { label: "นางสาว", value: "ms" },
          ]
        : [
            { label: "Mr.", value: "mr" },
            { label: "Mrs.", value: "mrs" },
            { label: "Ms.", value: "ms" },
          ],
    [props.locale]
  );
  const genderOptions = useMemo(
    () =>
      props.locale === "th"
        ? [
            { label: "ชาย", value: "male" },
            { label: "หญิง", value: "female" },
            { label: "ไม่ระบุ", value: "unspecified" },
          ]
        : [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Prefer not to say", value: "unspecified" },
          ],
    [props.locale]
  );
  const prefixMissing = !props.prefix;
  const genderMissing = !props.gender;
  const hasSelectionError = prefixMissing || genderMissing;

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (hasSelectionError) {
      return;
    }

    props.onSubmit();
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppCard style={styles.card}>
          <View style={styles.hero}>
            <SectionTitle eyebrow={t.tagline} title="REGISTER" />
          </View>

          <View style={styles.form}>
            <AppSelect
              label={t.prefix}
              placeholder={t.prefixPlaceholder}
              value={props.prefix}
              options={prefixOptions}
              onChange={props.onPrefixChange}
              invalid={submitAttempted && prefixMissing}
            />
            <AppSelect
              label={t.gender}
              placeholder={t.genderPlaceholder}
              value={props.gender}
              options={genderOptions}
              onChange={props.onGenderChange}
              invalid={submitAttempted && genderMissing}
            />
            {submitAttempted && hasSelectionError ? <Text style={styles.errorText}>{t.selectionRequired}</Text> : null}
            <AppInput
              label={t.firstName}
              value={props.firstName}
              onChangeText={props.onFirstNameChange}
              placeholder={t.firstName}
            />
            <AppInput
              label={t.lastName}
              value={props.lastName}
              onChangeText={props.onLastNameChange}
              placeholder={t.lastName}
            />
            <AppInput
              label={t.username}
              value={props.username}
              onChangeText={props.onUsernameChange}
              placeholder={t.username}
            />
            <AppInput
              label={t.password}
              value={props.password}
              onChangeText={props.onPasswordChange}
              placeholder="........"
              secureTextEntry
            />
            <AppInput
              label={t.confirmPassword}
              value={props.confirmPassword}
              onChangeText={props.onConfirmPasswordChange}
              placeholder="........"
              secureTextEntry
            />

            <View style={styles.actions}>
              <AppButton label={t.createAccount} onPress={handleSubmit} loading={props.loading} />
              <Pressable onPress={props.onBackToLogin}>
                <Text style={styles.backText}>{t.backToLogin}</Text>
              </Pressable>
            </View>
          </View>
        </AppCard>
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
  card: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  hero: {
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    marginTop: -2,
  },
  backText: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
});
