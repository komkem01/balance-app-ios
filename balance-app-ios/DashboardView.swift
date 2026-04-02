//
//  DashboardView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct DashboardView: View {
	struct WalletItem: Identifiable {
		let id = UUID()
		let name: String
		let balance: Double
	}

	struct TransactionItem: Identifiable {
		let id = UUID()
		let title: String
		let wallet: String
		let date: String
		let amount: Double
		let isExpense: Bool
	}

	struct BudgetItem: Identifiable {
		let id = UUID()
		let category: String
		let percent: Double
	}

	@State private var selectedPath = "dashboard"
	@State private var showMenu = false
	@State private var navigateToHistory = false
	@State private var navigateToWallets = false
	@State private var navigateToCategories = false
	@State private var navigateToBudgets = false
	@State private var navigateToRecord = false
	@State private var navigateToProfile = false
	@State private var navigateToSettings = false

	private let wallets: [WalletItem] = [
		.init(name: "Main Wallet", balance: 29850),
		.init(name: "Savings", balance: 182000),
		.init(name: "Cash", balance: 4200)
	]

	private let recentTransactions: [TransactionItem] = [
		.init(title: "Coffee Beans", wallet: "Cash", date: "2 Apr 2026", amount: 180, isExpense: true),
		.init(title: "Monthly Salary", wallet: "Main Wallet", date: "1 Apr 2026", amount: 42000, isExpense: false),
		.init(title: "Electric Bill", wallet: "Main Wallet", date: "29 Mar 2026", amount: 1650, isExpense: true)
	]

	private let budgets: [BudgetItem] = [
		.init(category: "Food", percent: 72),
		.init(category: "Transport", percent: 44),
		.init(category: "Shopping", percent: 92)
	]

	private var totalNetWorth: Double {
		wallets.reduce(0) { $0 + $1.balance }
	}

	var body: some View {
		ZStack {
			Color(red: 0.97, green: 0.98, blue: 0.99)
				.ignoresSafeArea()

			Circle()
				.fill(Color.indigo.opacity(0.07))
				.frame(width: 420, height: 420)
				.blur(radius: 70)
				.offset(x: -170, y: -320)

			Circle()
				.fill(Color.purple.opacity(0.07))
				.frame(width: 420, height: 420)
				.blur(radius: 70)
				.offset(x: 190, y: 360)

			ScrollView {
				VStack(alignment: .leading, spacing: 20) {
					headerSection
					monthlyPerformanceCard
					recentActivityCard
					walletSnapshotCard
					budgetStatusCard
				}
				.padding(.horizontal, 20)
				.padding(.vertical, 24)
			}
		}
		.toolbar {
			ToolbarItem(placement: .topBarLeading) {
				Button {
					showMenu = true
				} label: {
					Image(systemName: "line.3.horizontal")
						.font(.system(size: 14, weight: .bold))
						.foregroundStyle(.black.opacity(0.75))
				}
			}

			ToolbarItem(placement: .topBarTrailing) {
				Button {
					navigate(to: .dashboard)
				} label: {
					Label("Dashboard", systemImage: "house")
						.font(.system(size: 11, weight: .bold))
				}
				.disabled(true)
				.opacity(0.5)
			}
		}
		.sheet(isPresented: $showMenu) {
			AppNavigationMenuSheet(currentRoute: .dashboard) { route in
				navigate(to: route)
			}
				.presentationDetents([.medium, .large])
		}
		.background {
			Group {
				NavigationLink("", isActive: $navigateToHistory) {
					TransactionLedgerView()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToWallets) {
					WalletView()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToCategories) {
					CategoriesView()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToBudgets) {
					BudgetView()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToRecord) {
					NewEntryView()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToProfile) {
					AccountProfile()
				}
				.hidden()

				NavigationLink("", isActive: $navigateToSettings) {
					SettingView()
				}
				.hidden()
			}
		}
		.navigationBarBackButtonHidden(true)
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 14) {
			Text(selectedPath.uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text(pageTitle)
				.font(.system(size: 30, weight: .light))

			HStack {
				VStack(alignment: .leading, spacing: 4) {
					Text("Total Net Worth".uppercased())
						.font(.system(size: 9, weight: .bold))
						.tracking(2)
						.foregroundColor(.gray)

					Text(totalNetWorth, format: .currency(code: "THB"))
						.font(.system(size: 26, weight: .medium))
				}

				Spacer()

				Button {
					navigate(to: .record)
				} label: {
					Text("Quick Entry".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.5)
						.foregroundColor(.white)
						.padding(.horizontal, 18)
						.padding(.vertical, 11)
						.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
						.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
				}
			}
		}
	}

	private var monthlyPerformanceCard: some View {
		VStack(alignment: .leading, spacing: 18) {
			HStack {
				Text("Monthly Performance".uppercased())
					.font(.system(size: 11, weight: .bold))
					.tracking(2)
					.foregroundColor(.gray)

				Spacer()

				legendDot(color: .indigo, title: "Income")
				legendDot(color: Color.gray.opacity(0.4), title: "Expense")
			}

			HStack(alignment: .bottom, spacing: 8) {
				ForEach([40, 70, 45, 90, 65, 80, 50, 60, 40, 85, 30, 95], id: \.self) { value in
					VStack(spacing: 0) {
						RoundedRectangle(cornerRadius: 8)
							.fill(Color.gray.opacity(0.15))
							.frame(height: CGFloat(value) * 1.2)
							.overlay(alignment: .bottom) {
								RoundedRectangle(cornerRadius: 8)
									.fill(Color.indigo)
									.frame(height: CGFloat(value) * 0.75)
									.opacity(0.6)
							}
					}
					.frame(maxWidth: .infinity)
				}
			}
			.frame(height: 150)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private var recentActivityCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			HStack {
				Text("Recent Activity".uppercased())
					.font(.system(size: 11, weight: .bold))
					.tracking(2)
					.foregroundColor(.gray)
				Spacer()
				Button("View All Ledger") {
					navigate(to: .history)
				}
				.font(.system(size: 10, weight: .bold))
				.foregroundColor(.indigo)
			}

			ForEach(recentTransactions) { item in
				HStack {
					VStack(alignment: .leading, spacing: 4) {
						Text(item.title)
							.font(.system(size: 14, weight: .medium))
						Text("\(item.wallet) • \(item.date)")
							.font(.system(size: 10, weight: .medium))
							.foregroundColor(.gray)
					}

					Spacer()

					Text((item.isExpense ? "-" : "+") + String(format: "%.0f", item.amount))
						.font(.system(size: 14, weight: .semibold))
						.foregroundColor(item.isExpense ? .red : .green)
				}

				if item.id != recentTransactions.last?.id {
					Divider()
						.overlay(Color.gray.opacity(0.15))
				}
			}
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private var walletSnapshotCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			Text("Active Wallets".uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(2)
				.foregroundColor(Color.white.opacity(0.55))

			ForEach(wallets) { wallet in
				VStack(alignment: .leading, spacing: 4) {
					Text(wallet.name.uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.6)
						.foregroundColor(Color.white.opacity(0.65))

					Text(wallet.balance, format: .currency(code: "THB"))
						.font(.system(size: 24, weight: .light))
						.foregroundColor(.white)
				}
			}

			Button {
				navigate(to: .wallets)
			} label: {
				Text("Manage Assets".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.6)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 12)
					.overlay(
						RoundedRectangle(cornerRadius: 12)
							.stroke(Color.white.opacity(0.18), lineWidth: 1)
					)
			}
		}
		.padding(22)
		.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
	}

	private var budgetStatusCard: some View {
		VStack(alignment: .leading, spacing: 18) {
			Text("Budget Status".uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(2)
				.foregroundColor(.gray)

			ForEach(budgets) { item in
				VStack(spacing: 8) {
					HStack {
						Text(item.category.uppercased())
							.font(.system(size: 10, weight: .bold))
							.tracking(1.8)
						Spacer()
						Text("\(Int(item.percent))%")
							.font(.system(size: 10, weight: .bold))
							.foregroundColor(.gray)
					}

					GeometryReader { proxy in
						ZStack(alignment: .leading) {
							Capsule()
								.fill(Color.gray.opacity(0.15))
							Capsule()
								.fill(item.percent > 90 ? Color.red : Color.black)
								.frame(width: proxy.size.width * (item.percent / 100))
						}
					}
					.frame(height: 7)
				}
			}
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private func legendDot(color: Color, title: String) -> some View {
		HStack(spacing: 5) {
			Circle()
				.fill(color)
				.frame(width: 6, height: 6)
			Text(title.uppercased())
				.font(.system(size: 9, weight: .bold))
				.foregroundColor(.gray)
		}
	}

	private func navigate(to route: AppRoute) {
		selectedPath = route.rawValue
		showMenu = false

		switch route {
		case .history:
			navigateToHistory = true
		case .wallets:
			navigateToWallets = true
		case .categories:
			navigateToCategories = true
		case .budgets:
			navigateToBudgets = true
		case .record:
			navigateToRecord = true
		case .profile:
			navigateToProfile = true
		case .settings:
			navigateToSettings = true
		case .dashboard:
			break
		default:
			break
		}
	}

	private var pageTitle: String {
		switch selectedPath {
		case "dashboard":
			return "Financial Overview"
		case "history":
			return "Transaction Ledger"
		case "wallets":
			return "Asset Management"
		case "categories":
			return "Taxonomy Settings"
		case "budgets":
			return "Budget Allocation"
		case "record":
			return "New Entry"
		case "profile":
			return "User Identity"
		case "settings":
			return "System Preferences"
		default:
			return "Archive"
		}
	}
}

#Preview {
	DashboardView()
}

