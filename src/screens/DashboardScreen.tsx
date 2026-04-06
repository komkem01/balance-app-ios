import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { theme } from "../theme";

type DashboardScreenProps = {
  onQuickEntry: () => void;
  onLogout: () => void;
};

const recentActivity = [
  { id: "1", title: "Coffee Beans", wallet: "Daily Wallet", amount: -165, date: "Today" },
  { id: "2", title: "Salary", wallet: "Main Account", amount: 28500, date: "03 Apr" },
  { id: "3", title: "Fuel", wallet: "Daily Wallet", amount: -840, date: "02 Apr" },
];

const wallets = [
  { id: "1", name: "Main Account", amount: 72880 },
  { id: "2", name: "Daily Wallet", amount: 5140 },
  { id: "3", name: "Savings Pod", amount: 200000 },
];

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

export function DashboardScreen({ onQuickEntry, onLogout }: DashboardScreenProps) {
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
          <Text style={styles.netWorth}>THB 278,020.00</Text>
          <View style={styles.quickRow}>
            <AppButton label="Quick Entry" onPress={onQuickEntry} />
          </View>
        </AppCard>

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionAction}>View All Ledger</Text>
          </View>
          <View style={styles.stack}>
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
