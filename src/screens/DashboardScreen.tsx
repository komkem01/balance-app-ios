import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { theme } from "../theme";

type DashboardScreenProps = {
  onQuickEntry: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  loading: boolean;
  error?: string;
  totalNetWorth: number;
  wallets: Array<{ id: string; name: string; amount: number }>;
  recentActivity: Array<{ id: string; title: string; wallet: string; amount: number; date: string }>;
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

export function DashboardScreen({
  onQuickEntry,
  onLogout,
  onRefresh,
  loading,
  error,
  totalNetWorth,
  wallets,
  recentActivity,
}: DashboardScreenProps) {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.path}>Dashboard</Text>
            <Text style={styles.title}>Balance Overview</Text>
          </View>
          <AppButton label="Logout" onPress={onLogout} variant="ghost" />
        </View>

        <AppCard style={styles.summaryCard}>
          <Text style={styles.label}>Total Net Worth</Text>
          <Text style={styles.netWorth}>{formatCurrency(totalNetWorth)}</Text>
          <View style={styles.quickRow}>
            <View style={styles.summaryActions}>
              <AppButton label="Quick Entry" onPress={onQuickEntry} />
              <AppButton label="Refresh" onPress={onRefresh} variant="ghost" />
            </View>
            {loading ? <Text style={styles.hint}>Syncing dashboard data...</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionAction}>View All Ledger</Text>
          </View>
          <View style={styles.stack}>
            {recentActivity.length === 0 ? <Text style={styles.emptyText}>No transactions yet</Text> : null}
            {recentActivity.map((item) => {
              const income = item.amount > 0;
              return (
                <View key={item.id} style={styles.row}>
                  <View>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>{item.wallet} . {item.date}</Text>
                  </View>
                  <Text style={[styles.amount, income ? styles.income : styles.expense]}>{formatCurrency(item.amount)}</Text>
                </View>
              );
            })}
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Wallet Snapshot</Text>
          <View style={styles.stack}>
            {wallets.length === 0 ? <Text style={styles.emptyText}>No wallets found</Text> : null}
            {wallets.map((wallet) => (
              <View key={wallet.id} style={styles.row}>
                <Text style={styles.rowTitle}>{wallet.name}</Text>
                <Text style={styles.amount}>{formatCurrency(wallet.amount)}</Text>
              </View>
            ))}
          </View>
        </AppCard>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
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
    fontSize: 32,
    letterSpacing: -0.8,
  },
  summaryCard: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  netWorth: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 30,
    letterSpacing: -0.5,
  },
  quickRow: {
    marginTop: theme.spacing.sm,
  },
  summaryActions: {
    gap: theme.spacing.sm,
  },
  hint: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginTop: theme.spacing.sm,
  },
  error: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    marginTop: theme.spacing.sm,
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
    letterSpacing: 1.5,
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
});
