import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { AppSelect } from "../components/AppSelect";
import { theme } from "../theme";

type LedgerRow = {
  id: string;
  title: string;
  wallet: string;
  amount: number;
  date: string;
  rawDate?: string;
};

type TransactionsScreenProps = {
  transactions: LedgerRow[];
  loading: boolean;
  error?: string;
  totalNetWorth: number;
  onOpenSidebar: () => void;
  onQuickEntry: () => void;
  onRefresh: () => void;
};

type PeriodFilter = "all" | "7d" | "30d" | "90d" | "1y";
type TypeFilter = "all" | "income" | "expense";

const PAGE_SIZE = 10;

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

const isWithinRange = (dateValue: string | undefined, period: PeriodFilter) => {
  if (period === "all") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (period === "7d") {
    return diffDays <= 7;
  }
  if (period === "30d") {
    return diffDays <= 30;
  }
  if (period === "90d") {
    return diffDays <= 90;
  }
  return diffDays <= 365;
};

export function TransactionsScreen({
  transactions,
  loading,
  error,
  totalNetWorth,
  onOpenSidebar,
  onQuickEntry,
  onRefresh,
}: TransactionsScreenProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [walletFilter, setWalletFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const walletOptions = useMemo(() => {
    const wallets = Array.from(new Set(transactions.map((item) => item.wallet))).sort((a, b) => a.localeCompare(b));
    return [
      { label: "All Wallets", value: "all" },
      ...wallets.map((wallet) => ({ label: wallet, value: wallet })),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const type = item.amount >= 0 ? "income" : "expense";
      const matchType = typeFilter === "all" || typeFilter === type;
      const matchWallet = walletFilter === "all" || item.wallet === walletFilter;
      const matchPeriod = isWithinRange(item.rawDate, periodFilter);
      return matchType && matchWallet && matchPeriod;
    });
  }, [transactions, periodFilter, typeFilter, walletFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, typeFilter, walletFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  const displayStart = filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(filteredTransactions.length, currentPage * PAGE_SIZE);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.path}>Overview</Text>
              <Text style={styles.title}>Transaction Ledger</Text>
            </View>
            <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}>
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.netWorthWrap}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                {formatCurrency(totalNetWorth)}
              </Text>
            </View>
            <Pressable onPress={onQuickEntry} style={({ pressed }) => [styles.quickEntryBtn, pressed && styles.quickEntryBtnPressed]}>
              <Text style={styles.quickEntryText}>Quick Entry</Text>
            </Pressable>
          </View>
        </View>

        <AppCard>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Transaction Ledger</Text>
            <Pressable onPress={onRefresh} style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}>
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          <View style={styles.filtersWrap}>
            <AppSelect
              label="Period"
              placeholder="Select period"
              value={periodFilter}
              options={[
                { label: "All Time", value: "all" },
                { label: "Last 7 Days", value: "7d" },
                { label: "Last 30 Days", value: "30d" },
                { label: "Last 90 Days", value: "90d" },
                { label: "Last 1 Year", value: "1y" },
              ]}
              onChange={(value) => setPeriodFilter(value as PeriodFilter)}
            />
            <AppSelect
              label="Type"
              placeholder="Select type"
              value={typeFilter}
              options={[
                { label: "All Activity", value: "all" },
                { label: "Income", value: "income" },
                { label: "Expense", value: "expense" },
              ]}
              onChange={(value) => setTypeFilter(value as TypeFilter)}
            />
            <AppSelect
              label="Wallet"
              placeholder="Select wallet"
              value={walletFilter}
              options={walletOptions}
              onChange={setWalletFilter}
            />
          </View>

          <Text style={styles.resultMeta}>
            Displaying {displayStart}-{displayEnd} of {filteredTransactions.length} Records
          </Text>

          {loading ? <Text style={styles.hint}>Syncing transactions...</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {paginatedTransactions.length === 0 ? <Text style={styles.emptyText}>No transactions found</Text> : null}

          <View style={styles.stack}>
            {paginatedTransactions.map((item) => {
              const income = item.amount > 0;
              const typeLabel = income ? "Income" : "Expense";
              return (
                <View key={item.id} style={styles.row}>
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>{(item.title || "T").slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowMeta}>{item.wallet} - {item.date}</Text>
                  </View>
                  <View style={styles.amountWrap}>
                    <Text style={[styles.amount, income ? styles.income : styles.expense]}>{formatCurrency(item.amount)}</Text>
                    <Text style={[styles.typeBadge, income ? styles.incomeBadge : styles.expenseBadge]}>{typeLabel}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.paginationFooter}>
            <Pressable
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={({ pressed }) => [styles.pagingButton, currentPage === 1 && styles.pagingButtonDisabled, pressed && currentPage !== 1 && styles.pagingButtonPressed]}
            >
              <Text style={[styles.pagingButtonText, currentPage === 1 && styles.pagingButtonTextDisabled]}>Previous Archive</Text>
            </Pressable>

            <View style={styles.pageList}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                const active = page === currentPage;
                return (
                  <Pressable key={page} onPress={() => setCurrentPage(page)} style={styles.pageNumberBtn}>
                    <Text style={[styles.pageNumberText, active && styles.pageNumberTextActive]}>{String(page).padStart(2, "0")}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={({ pressed }) => [styles.pagingButton, currentPage === totalPages && styles.pagingButtonDisabled, pressed && currentPage !== totalPages && styles.pagingButtonPressed]}
            >
              <Text style={[styles.pagingButtonText, currentPage === totalPages && styles.pagingButtonTextDisabled]}>Next Archive</Text>
            </Pressable>
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
    gap: theme.spacing.lg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
    gap: theme.spacing.xs,
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
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
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
  menuBtnText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
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
  quickEntryBtn: {
    minHeight: 48,
    minWidth: 150,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  quickEntryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  quickEntryText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: theme.radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  refreshBtnPressed: {
    opacity: 0.85,
  },
  refreshText: {
    color: theme.colors.indigo,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  filtersWrap: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  resultMeta: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: theme.spacing.md,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bgSoft,
    paddingBottom: theme.spacing.md,
    marginBottom: 2,
    gap: theme.spacing.md,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarBadgeText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
  },
  rowBody: {
    flex: 1,
    marginRight: theme.spacing.sm,
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
  amountWrap: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  typeBadge: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  incomeBadge: {
    backgroundColor: "#d1fae5",
    color: "#047857",
  },
  expenseBadge: {
    backgroundColor: "#ffe4e6",
    color: "#be123c",
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
  paginationFooter: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.bgSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  pagingButton: {
    paddingVertical: 8,
  },
  pagingButtonPressed: {
    opacity: 0.8,
  },
  pagingButtonDisabled: {
    opacity: 0.3,
  },
  pagingButtonText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  pagingButtonTextDisabled: {
    color: theme.colors.textSubtle,
  },
  pageList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    flex: 1,
  },
  pageNumberBtn: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  pageNumberText: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
  },
  pageNumberTextActive: {
    color: theme.colors.indigo,
    transform: [{ scale: 1.15 }],
  },
});
