import { Manrope_300Light, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authApi, type CategoryItem, type GenderItem, type MeResponse, type PrefixItem, type TransactionMonthlySummaryItem } from "./src/api/auth";
import { ApiError } from "./src/api/client";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";
import { QuickEntryScreen } from "./src/screens/QuickEntryScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AppSidebar } from "./src/components/AppSidebar";
import { theme } from "./src/theme";

type Locale = "en" | "th";
type Screen = "login" | "register" | "dashboard" | "transactions" | "quick-entry" | "profile";
const transferNotePrefix = "__transfer__|";

type TransferNoteMeta = {
  ref: string;
  direction: "in" | "out";
  counterpartyWalletID: string;
  userNote: string;
};

const parseTransferNote = (note: string): TransferNoteMeta | null => {
  if (!note.startsWith(transferNotePrefix)) {
    return null;
  }

  const [prefix, ref, direction, counterpartyWalletID, ...rest] = note.split("|");
  if (prefix !== "__transfer__") {
    return null;
  }
  if (!ref || (direction !== "in" && direction !== "out") || !counterpartyWalletID) {
    return null;
  }

  return {
    ref,
    direction,
    counterpartyWalletID,
    userNote: rest.join("|").trim(),
  };
};

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
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [genders, setGenders] = useState<GenderItem[]>([]);
  const [prefixes, setPrefixes] = useState<PrefixItem[]>([]);
  const [loginMessage, setLoginMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [bootLoading, setBootLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardWallets, setDashboardWallets] = useState<Array<{ id: string; name: string; amount: number }>>([]);
  const [dashboardCategories, setDashboardCategories] = useState<CategoryItem[]>([]);
  const [dashboardRecentActivity, setDashboardRecentActivity] = useState<
    Array<{ id: string; title: string; wallet: string; amount: number; date: string; rawDate?: string }>
  >([]);
  const [dashboardMonthlySummary, setDashboardMonthlySummary] = useState<TransactionMonthlySummaryItem[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<
    Array<{ id: string; title: string; wallet: string; amount: number; date: string; rawDate?: string }>
  >([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [sessionExpiredModalVisible, setSessionExpiredModalVisible] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [languageDevModalVisible, setLanguageDevModalVisible] = useState(false);
  const [languageDevMessage, setLanguageDevMessage] = useState("");
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    id: "",
    firstName: "",
    lastName: "",
    displayName: "",
    username: "",
    phone: "",
    profileImageURL: "",
    lastLogin: "",
  });
  const dashboardRequestInFlightRef = useRef(false);
  const sidebarCurrentScreen: "dashboard" | "transactions" | "profile" | "quick-entry" =
    screen === "transactions"
      ? "transactions"
      : screen === "profile"
        ? "profile"
        : screen === "quick-entry"
          ? "quick-entry"
          : "dashboard";

  const mapProfileInfo = (me: MeResponse) => {
    const fullName = `${me.first_name || ""} ${me.last_name || ""}`.trim();
    return {
      id: me.id || "",
      firstName: me.first_name || "",
      lastName: me.last_name || "",
      displayName: me.display_name || fullName || "-",
      username: me.account?.username || "-",
      phone: me.phone || "-",
      profileImageURL: me.profile_image_url || "",
      lastLogin: me.last_login
        ? new Date(me.last_login).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "-",
    };
  };

  const filteredPrefixes = useMemo(() => {
    if (!gender) {
      return [];
    }

    return prefixes.filter((item) => item.gender_id === gender);
  }, [gender, prefixes]);

  const genderOptions = useMemo(() => genders.map((item) => ({ label: item.name, value: item.id })), [genders]);
  const prefixOptions = useMemo(() => filteredPrefixes.map((item) => ({ label: item.name, value: item.id })), [filteredPrefixes]);

  const isSessionExpiredError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return true;
      }

      const normalized = `${error.code} ${error.message}`.toLowerCase();
      return normalized.includes("token") || normalized.includes("unauthorized") || normalized.includes("expired");
    }

    if (error instanceof Error) {
      const normalized = error.message.toLowerCase();
      return (
        normalized.includes("access-token-expired")
        || normalized.includes("access-token-missing")
        || normalized.includes("refresh-token")
        || normalized.includes("token")
        || normalized.includes("unauthorized")
      );
    }

    return false;
  };

  const resetAuthFormState = useCallback(() => {
    setUsername("");
    setPassword("");
    setPrefix("");
    setGender("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setConfirmPassword("");
    setRemember(false);
    setLoading(false);
    setLoginMessage("");
    setRegisterMessage("");
  }, []);

  const resetDashboardState = useCallback(() => {
    setDashboardError("");
    setDashboardWallets([]);
    setDashboardCategories([]);
    setDashboardRecentActivity([]);
    setDashboardMonthlySummary([]);
    setLedgerTransactions([]);
    setTotalNetWorth(0);
    setDashboardLoading(false);
  }, []);

  const handleSecureLogout = useCallback(
    async (message?: string) => {
      try {
        await authApi.logout();
      } catch {
        // Keep logout UX deterministic even if secure-store cleanup fails.
      }
      resetAuthFormState();
      resetDashboardState();
      setSidebarVisible(false);
      if (message) {
        setLoginMessage(message);
      }
      setScreen("login");
    },
    [resetAuthFormState, resetDashboardState]
  );

  const confirmLogout = async () => {
    setLogoutConfirmVisible(false);
    await handleSecureLogout();
  };

  const loadDashboardData = useCallback(async () => {
    if (sessionExpiredModalVisible) {
      return;
    }

    if (dashboardRequestInFlightRef.current) {
      return;
    }

    dashboardRequestInFlightRef.current = true;
    setDashboardLoading(true);
    setDashboardError("");

    try {
      const [wallets, categories, transactions, monthlySummary] = await Promise.all([
        authApi.listMyWallets(),
        authApi.listMyCategories(),
        authApi.listMyTransactions({ page: 1, size: 200 }),
        authApi.listMyTransactionMonthlySummary({ range: "1y" }),
      ]);

      const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
      const walletRows = wallets.map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        amount: Number(wallet.balance || 0),
      }));

      const netWorth = walletRows.reduce((sum, wallet) => sum + wallet.amount, 0);

      const transactionRows = transactions
        .slice()
        .sort((a, b) => {
          const aDate = new Date(a.transaction_date || a.created_at).getTime();
          const bDate = new Date(b.transaction_date || b.created_at).getTime();
          return bDate - aDate;
        })
        .map((item) => {
          const rawNote = item.note?.trim() || "";
          const transferMeta = parseTransferNote(rawNote);
          const transferFallback = locale === "th" ? "โอนเงินระหว่างกระเป๋า" : "Wallet transfer";
          const title = transferMeta
            ? transferMeta.userNote || transferFallback
            : rawNote || item.type;

          return {
            id: item.id,
            title,
            wallet: item.wallet_id ? walletMap.get(item.wallet_id) || "Unknown Wallet" : "Unknown Wallet",
            amount: item.type === "expense" ? -Math.abs(Number(item.amount || 0)) : Math.abs(Number(item.amount || 0)),
            date: new Date(item.transaction_date || item.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
            }),
            rawDate: item.transaction_date || item.created_at,
          };
        });

      const recentRows = transactionRows.slice(0, 5);

      setDashboardWallets(walletRows);
      setDashboardCategories(categories);
      setLedgerTransactions(transactionRows);
      setDashboardRecentActivity(recentRows);
      setDashboardMonthlySummary(monthlySummary);
      setTotalNetWorth(netWorth);
    } catch (error) {
      if (isSessionExpiredError(error)) {
        setSessionExpiredMessage(locale === "th" ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" : "Session expired, please login again");
        setSessionExpiredModalVisible(true);
        return;
      }

      if (error instanceof ApiError) {
        setDashboardError(error.message || "Failed to load dashboard");
      } else if (error instanceof Error) {
        setDashboardError(error.message);
      } else {
        setDashboardError("Failed to load dashboard");
      }
    } finally {
      dashboardRequestInFlightRef.current = false;
      setDashboardLoading(false);
    }
  }, [locale, sessionExpiredModalVisible]);

  useEffect(() => {
    const boot = async () => {
      await authApi.initSession();

      try {
        const me = await authApi.getMe();
        setProfileInfo(mapProfileInfo(me));
        setScreen("dashboard");
        await loadDashboardData();
      } catch {
        setScreen("login");
      } finally {
        setBootLoading(false);
      }
    };

    void boot();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      setOptionsLoading(true);

      try {
        const [genderRes, prefixRes] = await Promise.all([authApi.listGenders(), authApi.listPrefixes()]);
        setGenders(genderRes);
        setPrefixes(prefixRes);
      } catch (error) {
        if (error instanceof ApiError) {
          setRegisterMessage(error.message || "Failed to load options");
          return;
        }

        setRegisterMessage("Failed to load options");
      } finally {
        setOptionsLoading(false);
      }
    };

    void loadOptions();
  }, []);

  useEffect(() => {
    if (screen !== "dashboard") {
      return;
    }

    const timer = setInterval(() => {
      void loadDashboardData();
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, [screen, loadDashboardData]);

  const submitLogin = async () => {
    setLoginMessage("");
    setLoading(true);

    try {
      await authApi.loginMember({
        username: username.trim(),
        password,
      });
      const me = await authApi.getMe();
      setProfileInfo(mapProfileInfo(me));
      await loadDashboardData();
      setScreen("dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setLoginMessage(error.message || "Login failed");
      } else if (error instanceof Error) {
        setLoginMessage(error.message);
      } else {
        setLoginMessage("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    setRegisterMessage("");

    if (password !== confirmPassword) {
      setRegisterMessage(locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authApi.registerMember({
        gender_id: gender || null,
        prefix_id: prefix || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        username: username.trim(),
        password,
      });

      setLoginMessage(locale === "th" ? "สร้างบัญชีสำเร็จ" : "Account created successfully");
      setScreen("login");
    } catch (error) {
      if (error instanceof ApiError) {
        setRegisterMessage(error.message || "Register failed");
      } else if (error instanceof Error) {
        setRegisterMessage(error.message);
      } else {
        setRegisterMessage("Register failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const onGenderChange = (value: string) => {
    setGender(value);
    setPrefix("");
  };

  const requestLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    setLanguageDevMessage(locale === "th" ? "การสลับภาษาระบบอยู่ระหว่างการพัฒนา" : "System language switching is currently under development.");
    setLanguageDevModalVisible(true);
  };

  if (!fontsLoaded || bootLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.bgBase }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === "login" ? (
        <LoginScreen
          locale={locale}
          onLocaleChange={requestLocaleChange}
          username={username}
          password={password}
          remember={remember}
          loading={loading}
          message={loginMessage}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onRememberChange={setRemember}
          onSubmit={() => {
            void submitLogin();
          }}
          onGoRegister={() => {
            setRegisterMessage("");
            setScreen("register");
          }}
        />
      ) : screen === "register" ? (
        <RegisterScreen
          locale={locale}
          genderOptions={genderOptions}
          prefixOptions={prefixOptions}
          optionsLoading={optionsLoading}
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          prefix={prefix}
          gender={gender}
          username={username}
          password={password}
          confirmPassword={confirmPassword}
          loading={loading}
          message={registerMessage}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onPhoneChange={setPhone}
          onPrefixChange={setPrefix}
          onGenderChange={onGenderChange}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onBackToLogin={() => setScreen("login")}
          onSubmit={() => {
            void submitRegister();
          }}
        />
      ) : screen === "dashboard" ? (
        <DashboardScreen
          onOpenSidebar={() => setSidebarVisible(true)}
          onQuickEntry={() => {
            setScreen("quick-entry");
          }}
          onRefresh={() => {
            void loadDashboardData();
          }}
          onViewAllLedger={() => setScreen("transactions")}
          loading={dashboardLoading}
          error={dashboardError}
          totalNetWorth={totalNetWorth}
          wallets={dashboardWallets}
          recentActivity={dashboardRecentActivity}
          monthlySummary={dashboardMonthlySummary}
        />
      ) : screen === "transactions" ? (
        <TransactionsScreen
          transactions={ledgerTransactions}
          loading={dashboardLoading}
          error={dashboardError}
          totalNetWorth={totalNetWorth}
          onOpenSidebar={() => setSidebarVisible(true)}
          onQuickEntry={() => {
            setScreen("quick-entry");
          }}
          onRefresh={() => {
            void loadDashboardData();
          }}
        />
      ) : screen === "profile" ? (
        <ProfileScreen
          profile={profileInfo}
          totalNetWorth={totalNetWorth}
          onOpenSidebar={() => setSidebarVisible(true)}
          onQuickEntry={() => {
            setScreen("quick-entry");
          }}
          onProfileUpdated={(nextMe) => {
            setProfileInfo(mapProfileInfo(nextMe));
          }}
        />
      ) : (
        <QuickEntryScreen
          totalNetWorth={totalNetWorth}
          wallets={dashboardWallets}
          categories={dashboardCategories}
          onOpenSidebar={() => setSidebarVisible(true)}
          onSubmitted={async () => {
            await loadDashboardData();
          }}
          onBack={() => setScreen("dashboard")}
        />
      )}
      <AppSidebar
        visible={sidebarVisible}
        currentScreen={sidebarCurrentScreen}
        userDisplayName={profileInfo.displayName || profileInfo.username || "Member"}
        onClose={() => setSidebarVisible(false)}
        onNavigate={(next) => {
          setScreen(next);
          setSidebarVisible(false);
        }}
        onComingSoon={(label) => {
          setSidebarVisible(false);
          setLanguageDevMessage(
            locale === "th"
              ? `${label} อยู่ระหว่างการพัฒนา`
              : `${label} is currently under development.`
          );
          setLanguageDevModalVisible(true);
        }}
        onLogout={() => {
          setSidebarVisible(false);
          setLogoutConfirmVisible(true);
        }}
      />
      {sessionExpiredModalVisible ? <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.white,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: "Manrope_700Bold",
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              {locale === "th" ? "เซสชันหมดอายุ" : "Session Expired"}
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontFamily: "Manrope_500Medium",
                fontSize: 13,
                lineHeight: 20,
                marginBottom: 18,
              }}
            >
              {sessionExpiredMessage || (locale === "th" ? "กรุณาเข้าสู่ระบบอีกครั้ง" : "Please login again")}
            </Text>
            <Pressable
              onPress={() => {
                setSessionExpiredModalVisible(false);
                void handleSecureLogout(sessionExpiredMessage || (locale === "th" ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง" : "Session expired, please login again"));
              }}
              style={{
                minHeight: 48,
                borderRadius: 16,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.white,
                  fontFamily: "Manrope_700Bold",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal> : null}
      {languageDevModalVisible ? <Modal visible transparent animationType="fade" onRequestClose={() => setLanguageDevModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.white,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: "Manrope_700Bold",
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              {locale === "th" ? "กำลังพัฒนา" : "Feature In Development"}
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontFamily: "Manrope_500Medium",
                fontSize: 13,
                lineHeight: 20,
                marginBottom: 18,
              }}
            >
              {languageDevMessage || (locale === "th" ? "การสลับภาษาระบบอยู่ระหว่างการพัฒนา" : "System language switching is currently under development.")}
            </Text>
            <Pressable
              onPress={() => setLanguageDevModalVisible(false)}
              style={{
                minHeight: 48,
                borderRadius: 16,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.white,
                  fontFamily: "Manrope_700Bold",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal> : null}
      {logoutConfirmVisible ? <Modal visible transparent animationType="fade" onRequestClose={() => setLogoutConfirmVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.35)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: theme.colors.borderSoft,
              backgroundColor: theme.colors.white,
              padding: 24,
            }}
          >
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: "Manrope_700Bold",
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              {locale === "th" ? "ยืนยันการออกจากระบบ" : "Confirm Logout"}
            </Text>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontFamily: "Manrope_500Medium",
                fontSize: 13,
                lineHeight: 20,
                marginBottom: 18,
              }}
            >
              {locale === "th" ? "คุณต้องการออกจากระบบใช่หรือไม่" : "Are you sure you want to logout from this session?"}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setLogoutConfirmVisible(false)}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.white,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: "Manrope_700Bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {locale === "th" ? "ยกเลิก" : "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void confirmLogout();
                }}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 16,
                  backgroundColor: theme.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.colors.white,
                    fontFamily: "Manrope_700Bold",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {locale === "th" ? "ออกจากระบบ" : "Logout"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal> : null}
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
