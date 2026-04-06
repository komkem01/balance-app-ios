import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { theme } from "../theme";

type TransactionsScreenProps = {
  transactions: Array<{ id: string; title: string; wallet: string; amount: number; date: string }>;
  loading: boolean;
  error?: string;
  onBack: () => void;
  onRefresh: () => void;
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

export function TransactionsScreen({ transactions, loading, error, onBack, onRefresh }: TransactionsScreenProps) {
  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.path}>Overview</Text>
            <Text style={styles.title}>Transaction Ledger</Text>
          </View>
          <View style={styles.headerActions}>
            <AppButton label="Back" onPress={onBack} variant="ghost" />
            <AppButton label="Refresh" onPress={onRefresh} variant="ghost" />
          </View>
        </View>

        <AppCard>
          {loading ? <Text style={styles.hint}>Syncing transactions...</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {transactions.length === 0 ? <Text style={styles.emptyText}>No transactions found</Text> : null}

          <View style={styles.stack}>
            {transactions.map((item) => {
              const income = item.amount > 0;
              return (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>{item.wallet} . {item.date}</Text>
                  </View>
                  <Text style={[styles.amount, income ? styles.income : styles.expense]}>{formatCurrency(item.amount)}</Text>
                </View>
              );
            })}
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
    alignItems: "flex-start",
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
    fontSize: 30,
    letterSpacing: -0.8,
  },
  headerActions: {
    gap: theme.spacing.sm,
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
  rowBody: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  rowTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  rowMeta: {
    marginTop: 2,
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  amount: {
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  income: {
    color: theme.colors.emerald,
  },
  expense: {
    color: theme.colors.rose,
  },
  hint: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    marginBottom: theme.spacing.sm,
  },
  error: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginBottom: theme.spacing.sm,
  },
});
