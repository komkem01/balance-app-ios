import { Manrope_300Light, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { theme } from "./src/theme";

type Locale = "en" | "th";
type Screen = "login" | "register" | "dashboard";

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [screen, setScreen] = useState<Screen>("login");
  const [locale, setLocale] = useState<Locale>("en");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [prefix, setPrefix] = useState("");
  const [gender, setGender] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("dashboard");
    }, 450);
  };

  const submitRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setScreen("dashboard");
    }, 450);
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bgBase }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      {screen === "login" ? (
        <LoginScreen
          locale={locale}
          onLocaleChange={setLocale}
          username={username}
          password={password}
          remember={remember}
          loading={loading}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onRememberChange={setRemember}
          onSubmit={submitLogin}
          onGoRegister={() => setScreen("register")}
        />
      ) : screen === "register" ? (
        <RegisterScreen
          locale={locale}
          firstName={firstName}
          lastName={lastName}
          prefix={prefix}
          gender={gender}
          username={username}
          password={password}
          confirmPassword={confirmPassword}
          loading={loading}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPrefixChange={setPrefix}
          onGenderChange={setGender}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onBackToLogin={() => setScreen("login")}
          onSubmit={submitRegister}
        />
      ) : (
        <DashboardScreen onQuickEntry={() => {}} onLogout={() => setScreen("login")} />
      )}
      <StatusBar style="dark" />
    </>
  );
}
