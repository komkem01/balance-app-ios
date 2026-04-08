import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { theme } from "../theme";

type DashboardScreenProps = {
  onOpenSidebar: () => void;
  onQuickEntry: () => void;
  onRefresh: () => void;
  onViewAllLedger: () => void;
  loading: boolean;
  error?: string;
  totalNetWorth: number;
  wallets: Array<{ id: string; name: string; amount: number }>;
  recentActivity: Array<{ id: string; title: string; wallet: string; amount: number; date: string }>;
  monthlySummary: Array<{ month: string; income_total: number; expense_total: number; transaction_count: number }>;
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

export function DashboardScreen({
  onOpenSidebar,
  onQuickEntry,
  onRefresh,
  onViewAllLedger,
  loading,
  error,
  totalNetWorth,
  wallets,
  recentActivity,
  monthlySummary,
}: DashboardScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompactHeader = width < 720;

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
      return formatter.format(date);
    });
  }, []);

  const monthlyBars = useMemo(() => {
    const normalizeMonthKey = (value: string) => {
      if (!value) {
        return "";
      }

      if (value.length >= 7 && value[4] === "-") {
        return value.slice(0, 7);
      }

      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      return `${parsed.getFullYear()}-${month}`;
    };

    const apiByMonth = new Map<string, number>();
    for (const item of monthlySummary) {
      const key = normalizeMonthKey(item.month);
      const income = Math.abs(Number(item.income_total || 0));
      const expense = Math.abs(Number(item.expense_total || 0));
      apiByMonth.set(key, income + expense);
    }

    const values = monthLabels.map((_, index) => {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const key = `${date.getFullYear()}-${month}`;
      return apiByMonth.get(key) || 0;
    });

    if (values.every((item) => item === 0)) {
      const fallback = recentActivity.length === 0
        ? [42, 68, 47, 85, 63, 76, 51]
        : recentActivity.slice(0, 7).map((item) => Math.abs(item.amount));
      const max = Math.max(...fallback, 1);
      return fallback.map((value, index) => ({
        height: Math.max(24, Math.round((value / max) * 100)),
        label: monthLabels[index],
      }));
    }

    const max = Math.max(...values, 1);
    return values.map((value, index) => ({
      height: Math.max(10, Math.round((value / max) * 100)),
      label: monthLabels[index],
    }));
  }, [monthlySummary, recentActivity, monthLabels]);

  const budgetUsage = useMemo(() => {
    const expense = recentActivity.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const income = recentActivity.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const baseline = Math.max(expense + income, 1);
    return Math.max(8, Math.min(95, Math.round((expense / baseline) * 100)));
  }, [recentActivity]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.path}>Dashboard</Text>
              <Text style={styles.title}>Account Overview</Text>
            </View>
            <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}>
              {/* <Text style={styles.menuBtnIcon}>===</Text> */}
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
          </View>

          <View style={[styles.headerActions, isCompactHeader && styles.headerActionsStack]}>
            <View style={styles.netWorthWrap}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text
                style={styles.netWorthValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {formatCurrency(totalNetWorth)}
              </Text>
            </View>
            <View style={[styles.headerButtons, isCompactHeader && styles.headerButtonsCompact]}>
              <AppButton label="Quick Entry" onPress={onQuickEntry} />
              <AppButton label="Refresh" onPress={onRefresh} variant="ghost" />
            </View>
          </View>
        </View>

        {loading ? <Text style={styles.hint}>Syncing dashboard data...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.columns, isWide && styles.columnsWide]}>
          <View style={styles.leftColumn}>
            <AppCard style={styles.performanceCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Monthly Performance</Text>
              </View>
              <View style={styles.chartWrap}>
                {monthlyBars.map((item, index) => (
                  <View key={`bar-${item.label}-${index}`} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: `${item.height}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </AppCard>

            <AppCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Pressable onPress={onViewAllLedger} hitSlop={8} style={styles.sectionActionButton}>
                  <Text style={styles.sectionAction}>View All</Text>
                </Pressable>
              </View>
              <View style={styles.stack}>
                {recentActivity.length === 0 ? <Text style={styles.emptyText}>No transactions yet</Text> : null}
                {recentActivity.slice(0, 5).map((item) => {
                  const income = item.amount > 0;
                  return (
                    <View key={item.id} style={styles.row}>
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowMeta}>{item.wallet} - {item.date}</Text>
                      </View>
                      <Text style={[styles.amount, income ? styles.income : styles.expense]}>{formatCurrency(item.amount)}</Text>
                    </View>
                  );
                })}
              </View>
            </AppCard>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.walletCard}>
              <Text style={styles.walletCardTitle}>Active Wallets</Text>
              <View style={styles.stack}>
                {wallets.length === 0 ? <Text style={styles.walletEmpty}>No wallets found</Text> : null}
                {wallets.slice(0, 3).map((wallet, index) => (
                  <View key={wallet.id} style={[styles.walletRow, index > 0 && styles.walletRowBorder]}>
                    <Text style={styles.walletLabel}>{wallet.name}</Text>
                    <Text style={styles.walletAmount}>{formatCurrency(wallet.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <AppCard>
              <Text style={styles.sectionTitle}>Budget Alert</Text>
              <Text style={styles.budgetText}>Spending has reached {budgetUsage}% of your active budget envelope.</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${budgetUsage}%` }]} />
              </View>
            </AppCard>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.lg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerTitleWrap: {
    gap: theme.spacing.xs,
    flex: 1,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuBtnPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  menuBtnIcon: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  menuBtnText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  path: {
    color: theme.colors.indigo,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_300Light",
    fontSize: 34,
    letterSpacing: -0.8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerActionsStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  netWorthWrap: {
    flex: 1,
    minWidth: 0,
  },
  netWorthLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  netWorthValue: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 25,
    letterSpacing: -0.4,
  },
  headerButtons: {
    width: 170,
    gap: theme.spacing.sm,
  },
  headerButtonsCompact: {
    width: "100%",
  },
  hint: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: -2,
  },
  error: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    marginTop: -2,
  },
  columns: {
    gap: theme.spacing.lg,
  },
  columnsWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftColumn: {
    flex: 2,
    gap: theme.spacing.lg,
  },
  rightColumn: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  performanceCard: {
    paddingBottom: theme.spacing.lg,
  },
  chartWrap: {
    height: 214,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "78%",
    alignSelf: "center",
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.35)",
    minHeight: 22,
  },
  barLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  walletCard: {
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
  },
  walletCardTitle: {
    color: "#94a3b8",
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  walletRow: {
    gap: 3,
    paddingBottom: theme.spacing.md,
  },
  walletRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingTop: theme.spacing.md,
  },
  walletLabel: {
    color: "#94a3b8",
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  walletAmount: {
    color: theme.colors.white,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  walletEmpty: {
    color: "#cbd5e1",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sectionAction: {
    color: theme.colors.indigo,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  sectionActionButton: {
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: theme.radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  stack: {
    gap: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bgSoft,
    paddingBottom: theme.spacing.md,
  },
  rowBody: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rowTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 2,
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  amount: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  income: {
    color: theme.colors.emerald,
  },
  expense: {
    color: theme.colors.rose,
  },
  budgetText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
    backgroundColor: theme.colors.bgSoft,
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.indigo,
  },
});
