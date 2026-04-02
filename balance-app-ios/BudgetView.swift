//
//  BudgetView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct BudgetView: View {
	struct BudgetItem: Identifiable {
		let id: UUID
		var categoryID: String
		var amount: Double
		var spent: Double
		var period: String
		var startDate: String?
		var endDate: String?
	}

	struct CategoryItem: Identifiable {
		let id: String
		let name: String
		let type: String
	}

	enum BudgetAction {
		case create
		case delete
	}

	@State private var budgets: [BudgetItem] = [
		.init(id: UUID(), categoryID: "food", amount: 5000, spent: 4250, period: "monthly", startDate: "2026-04-01", endDate: "2026-04-30"),
		.init(id: UUID(), categoryID: "transport", amount: 2000, spent: 620, period: "monthly", startDate: "2026-04-01", endDate: "2026-04-30"),
		.init(id: UUID(), categoryID: "shopping", amount: 3000, spent: 2760, period: "monthly", startDate: "2026-04-01", endDate: "2026-04-30")
	]

	@State private var categories: [CategoryItem] = [
		.init(id: "food", name: "Food & Drink", type: "expense"),
		.init(id: "transport", name: "Transport", type: "expense"),
		.init(id: "shopping", name: "Shopping", type: "expense"),
		.init(id: "salary", name: "Salary", type: "income")
	]

	@State private var walletsTotalNetWorth = 144500.0

	@State private var budgetsLoading = false
	@State private var budgetsSaving = false
	@State private var budgetsDeletingID: UUID?
	@State private var budgetsError = ""

	@State private var budgetPeriodFilter = "all"
	@State private var newBudgetCategoryID = ""
	@State private var newBudgetAmount = "0"
	@State private var newBudgetPeriod = "monthly"

	@State private var budgetConfirmOpen = false
	@State private var budgetConfirmTitle = "Confirm Action"
	@State private var budgetConfirmDescription = ""
	@State private var budgetConfirmLabel = "Confirm"
	@State private var budgetConfirmAction: BudgetAction?
	@State private var budgetPendingID: UUID?

	@State private var showToast = false
	@State private var toastMessage = ""
	@State private var showMenu = false
	@State private var navigateToDashboard = false
	@State private var navigateToHistory = false
	@State private var navigateToWallets = false
	@State private var navigateToCategories = false
	@State private var navigateToRecord = false
	@State private var navigateToProfile = false
	@State private var navigateToSettings = false

	private let budgetPeriods = ["daily", "weekly", "monthly"]

	private var totalNetWorth: Double {
		walletsTotalNetWorth
	}

	private var filteredBudgets: [BudgetItem] {
		if budgetPeriodFilter == "all" {
			return budgets
		}
		return budgets.filter { $0.period == budgetPeriodFilter }
	}

	private var expenseCategories: [CategoryItem] {
		categories.filter { $0.type == "expense" }
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
				VStack(alignment: .leading, spacing: 18) {
					headerSection
					createBudgetCard
					budgetsListCard
				}
				.padding(.horizontal, 20)
				.padding(.vertical, 24)
			}

			if showToast {
				VStack {
					HStack {
						Spacer()
						Text(toastMessage.uppercased())
							.font(.system(size: 10, weight: .bold))
							.tracking(1.6)
							.padding(.horizontal, 18)
							.padding(.vertical, 12)
							.background(Color.white)
							.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
							.overlay(
								RoundedRectangle(cornerRadius: 14)
									.stroke(Color.gray.opacity(0.16), lineWidth: 1)
							)
							.shadow(color: Color.black.opacity(0.12), radius: 14, x: 0, y: 10)
					}
					.padding(.horizontal, 20)
					.padding(.top, 18)

					Spacer()
				}
				.transition(.move(edge: .top).combined(with: .opacity))
			}
		}
		.navigationTitle("Budgets")
		.navigationBarTitleDisplayMode(.inline)
		.toolbar {
			ToolbarItem(placement: .topBarLeading) {
				Button {
					showMenu = true
				} label: {
					Image(systemName: "line.3.horizontal")
				}
			}

			ToolbarItem(placement: .topBarTrailing) {
				Button {
					navigate(to: .dashboard)
				} label: {
					Label("Dashboard", systemImage: "house")
						.font(.system(size: 11, weight: .bold))
				}
			}
		}
		.sheet(isPresented: $showMenu) {
			AppNavigationMenuSheet(currentRoute: .budgets) { route in
				navigate(to: route)
			}
			.presentationDetents([.medium, .large])
		}
		.background {
			Group {
				NavigationLink("", isActive: $navigateToDashboard) { DashboardView() }.hidden()
				NavigationLink("", isActive: $navigateToHistory) { TransactionLedgerView() }.hidden()
				NavigationLink("", isActive: $navigateToWallets) { WalletView() }.hidden()
				NavigationLink("", isActive: $navigateToCategories) { CategoriesView() }.hidden()
				NavigationLink("", isActive: $navigateToRecord) { NewEntryView() }.hidden()
				NavigationLink("", isActive: $navigateToProfile) { AccountProfile() }.hidden()
				NavigationLink("", isActive: $navigateToSettings) { SettingView() }.hidden()
			}
		}
		.alert(budgetConfirmTitle, isPresented: $budgetConfirmOpen) {
			Button("Cancel", role: .cancel) {
				budgetPendingID = nil
			}
			Button(budgetConfirmLabel, role: budgetConfirmAction == .delete ? .destructive : nil) {
				confirmBudgetAction()
			}
		} message: {
			Text(budgetConfirmDescription)
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("BUDGETS")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("Budget Allocation")
				.font(.system(size: 30, weight: .light))

			HStack {
				VStack(alignment: .leading, spacing: 2) {
					Text("Total Net Worth".uppercased())
						.font(.system(size: 9, weight: .bold))
						.tracking(2)
						.foregroundColor(.gray)
					Text(totalNetWorth, format: .currency(code: "THB"))
						.font(.system(size: 24, weight: .medium))
				}
				Spacer()
				Button {
					showToastMessage("Quick entry is under development")
				} label: {
					Text("Quick Entry".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.5)
						.foregroundColor(.white)
						.padding(.horizontal, 16)
						.padding(.vertical, 11)
						.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
						.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
				}
			}
		}
	}

	private var createBudgetCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			cardTitle("Set Spending Constraint")

			fieldLabel("Expense Category")
			Menu {
				ForEach(expenseCategories) { category in
					Button(category.name) {
						newBudgetCategoryID = category.id
					}
				}
			} label: {
				pickerButton(newBudgetCategoryID.isEmpty ? "Select Category" : getCategoryName(newBudgetCategoryID))
			}

			fieldLabel("Budget Amount")
			appTextField("0.00", text: $newBudgetAmount, keyboardType: .decimalPad)

			fieldLabel("Period")
			Menu {
				ForEach(budgetPeriods, id: \.self) { period in
					Button(period.capitalized) {
						newBudgetPeriod = period
					}
				}
			} label: {
				pickerButton(newBudgetPeriod.capitalized)
			}

			if !budgetsError.isEmpty {
				Text(budgetsError)
					.font(.system(size: 11, weight: .semibold))
					.foregroundColor(.red)
			}

			Button {
				requestAddBudget()
			} label: {
				Text(budgetsSaving ? "Processing..." : "Create Budget".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.background(Color.indigo)
					.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
			}
			.disabled(budgetsSaving || budgetsLoading)
			.opacity((budgetsSaving || budgetsLoading) ? 0.65 : 1)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private var budgetsListCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			HStack {
				cardTitle("Budget Archive")
				Spacer()
				Menu {
					Button("All") { budgetPeriodFilter = "all" }
					ForEach(budgetPeriods, id: \.self) { period in
						Button(period.capitalized) { budgetPeriodFilter = period }
					}
				} label: {
					HStack(spacing: 6) {
						Text(budgetPeriodFilter == "all" ? "All" : budgetPeriodFilter.capitalized)
						Image(systemName: "chevron.down")
							.font(.system(size: 11, weight: .bold))
					}
					.font(.system(size: 10, weight: .bold))
					.padding(.horizontal, 10)
					.padding(.vertical, 8)
					.background(Color.gray.opacity(0.12))
					.clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
				}
			}

			if budgetsLoading {
				Text("Loading budget archive...")
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.gray)
			}

			if !budgetsError.isEmpty {
				Text(budgetsError)
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.red)
			}

			if filteredBudgets.isEmpty {
				Text("No budget records found")
					.font(.system(size: 12))
					.foregroundColor(.gray)
			}

			ForEach(filteredBudgets) { budget in
				budgetRow(budget)
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

	private func budgetRow(_ budget: BudgetItem) -> some View {
		let percent = budget.amount > 0 ? min((budget.spent / budget.amount) * 100, 100) : 0

		return VStack(alignment: .leading, spacing: 10) {
			HStack {
				VStack(alignment: .leading, spacing: 2) {
					Text(getCategoryName(budget.categoryID).uppercased())
						.font(.system(size: 12, weight: .bold))
						.tracking(1.2)
					Text("\(budget.period.capitalized) • \(formatBudgetRange(startDate: budget.startDate, endDate: budget.endDate))")
						.font(.system(size: 10, weight: .medium))
						.foregroundColor(.gray)
				}

				Spacer()

				Button {
					requestRemoveBudget(budget)
				} label: {
					Text((budgetsDeletingID == budget.id ? "Deleting..." : "Delete").uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.2)
						.foregroundColor(.red)
						.padding(.horizontal, 10)
						.padding(.vertical, 7)
						.overlay(
							RoundedRectangle(cornerRadius: 9)
								.stroke(Color.red.opacity(0.25), lineWidth: 1)
						)
				}
				.disabled(budgetsDeletingID == budget.id)
			}

			HStack {
				Text("Used \(budget.spent, format: .currency(code: "THB")) of \(budget.amount, format: .currency(code: "THB"))")
					.font(.system(size: 11, weight: .medium))
					.foregroundColor(.gray)
				Spacer()
				Text("\(Int(percent))%")
					.font(.system(size: 11, weight: .bold))
			}

			GeometryReader { proxy in
				ZStack(alignment: .leading) {
					Capsule()
						.fill(Color.gray.opacity(0.15))
					Capsule()
						.fill(percent >= 90 ? Color.red : Color.black)
						.frame(width: proxy.size.width * (percent / 100))
				}
			}
			.frame(height: 8)
		}
		.padding(14)
		.background(Color.gray.opacity(0.07))
		.clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
	}

	private func requestAddBudget() {
		guard !newBudgetCategoryID.isEmpty, let amount = Double(newBudgetAmount), amount > 0 else {
			budgetsError = "budget-amount-required"
			return
		}

		_ = amount
		budgetConfirmAction = .create
		budgetConfirmTitle = "Confirm Create Budget"
		budgetConfirmDescription = "Create this budget with current information?"
		budgetConfirmLabel = "Create"
		budgetConfirmOpen = true
	}

	private func requestRemoveBudget(_ budget: BudgetItem) {
		budgetPendingID = budget.id
		budgetConfirmAction = .delete
		budgetConfirmTitle = "Confirm Delete Budget"
		budgetConfirmDescription = "Delete budget for \(getCategoryName(budget.categoryID))?"
		budgetConfirmLabel = "Delete"
		budgetConfirmOpen = true
	}

	private func confirmBudgetAction() {
		guard let action = budgetConfirmAction else { return }

		switch action {
		case .create:
			guard let amount = Double(newBudgetAmount), amount > 0 else {
				budgetsError = "budget-amount-required"
				return
			}

			budgetsSaving = true
			budgets.insert(
				.init(
					id: UUID(),
					categoryID: newBudgetCategoryID,
					amount: amount,
					spent: 0,
					period: newBudgetPeriod,
					startDate: "2026-04-01",
					endDate: "2026-04-30"
				),
				at: 0
			)
			newBudgetCategoryID = ""
			newBudgetAmount = "0"
			newBudgetPeriod = "monthly"
			budgetsSaving = false
			showToastMessage("Budget Created Successfully")

		case .delete:
			guard let pendingID = budgetPendingID else { return }
			budgetsDeletingID = pendingID
			budgets.removeAll { $0.id == pendingID }
			budgetsDeletingID = nil
			budgetPendingID = nil
			showToastMessage("Budget Deleted Successfully")
		}

		budgetConfirmAction = nil
	}

	private func getCategoryName(_ id: String) -> String {
		categories.first(where: { $0.id == id })?.name ?? "Unknown"
	}

	private func formatBudgetRange(startDate: String?, endDate: String?) -> String {
		let startLabel = toReadableBudgetDate(startDate)
		let endLabel = toReadableBudgetDate(endDate)
		if startLabel == "-" && endLabel == "-" {
			return "Date Range: N/A"
		}
		return "Date Range: \(startLabel) - \(endLabel)"
	}

	private func toReadableBudgetDate(_ value: String?) -> String {
		guard let value else { return "-" }
		let formatter = ISO8601DateFormatter()
		let plain = DateFormatter()
		plain.dateFormat = "yyyy-MM-dd"

		let date = formatter.date(from: value) ?? plain.date(from: value)
		guard let date else { return value }

		let out = DateFormatter()
		out.dateFormat = "d MMM yyyy"
		return out.string(from: date)
	}

	private func cardTitle(_ title: String) -> some View {
		Text(title.uppercased())
			.font(.system(size: 11, weight: .bold))
			.tracking(2)
			.foregroundColor(.gray)
	}

	private func fieldLabel(_ title: String) -> some View {
		Text(title.uppercased())
			.font(.system(size: 10, weight: .semibold))
			.tracking(1.4)
			.foregroundColor(.gray)
	}

	private func appTextField(_ placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType = .default) -> some View {
		TextField(placeholder, text: text)
			.keyboardType(keyboardType)
			.textInputAutocapitalization(.never)
			.autocorrectionDisabled()
			.font(.system(size: 14))
			.padding(.horizontal, 14)
			.padding(.vertical, 12)
			.background(Color.white)
			.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
			.overlay(
				RoundedRectangle(cornerRadius: 12)
					.stroke(Color.gray.opacity(0.2), lineWidth: 1)
			)
	}

	private func pickerButton(_ label: String) -> some View {
		HStack {
			Text(label)
				.foregroundColor(.black.opacity(0.8))
			Spacer()
			Image(systemName: "chevron.down")
				.font(.system(size: 11, weight: .bold))
				.foregroundColor(.gray)
		}
		.padding(.horizontal, 14)
		.padding(.vertical, 12)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 12)
				.stroke(Color.gray.opacity(0.2), lineWidth: 1)
		)
	}

	private func showToastMessage(_ message: String) {
		budgetsError = ""
		withAnimation(.spring()) {
			toastMessage = message
			showToast = true
		}

		DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
			withAnimation(.easeInOut) {
				showToast = false
			}
		}
	}

	private func navigate(to route: AppRoute) {
		showMenu = false

		switch route {
		case .dashboard:
			navigateToDashboard = true
		case .history:
			navigateToHistory = true
		case .wallets:
			navigateToWallets = true
		case .categories:
			navigateToCategories = true
		case .record:
			navigateToRecord = true
		case .profile:
			navigateToProfile = true
		case .settings:
			navigateToSettings = true
		case .budgets:
			break
		}
	}
}

#Preview {
	NavigationStack {
		BudgetView()
	}
}

