//
//  CategoriesView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct CategoriesView: View {
	struct CategoryItem: Identifiable {
		let id: UUID
		var name: String
		var type: String
		var colorHex: String
	}

	enum CategoryAction {
		case update
		case delete
	}

	@State private var categories: [CategoryItem] = [
		.init(id: UUID(), name: "Food & Drink", type: "expense", colorHex: "#EA580C"),
		.init(id: UUID(), name: "Salary", type: "income", colorHex: "#16A34A"),
		.init(id: UUID(), name: "Transport", type: "expense", colorHex: "#2563EB"),
		.init(id: UUID(), name: "Entertainment", type: "expense", colorHex: "#7C3AED")
	]

	@State private var categoriesLoading = false
	@State private var categoriesSaving = false
	@State private var categoriesError = ""

	@State private var categoryFilter = "all"
	@State private var newCategoryName = ""
	@State private var newCategoryType = "expense"
	@State private var newCategoryColor = "#0F172A"

	@State private var categoryEditOpen = false
	@State private var editCategoryID: UUID?
	@State private var editCategoryName = ""
	@State private var editCategoryType = "expense"
	@State private var editCategoryColor = "#0F172A"

	@State private var categoryConfirmOpen = false
	@State private var categoryConfirmTitle = "Confirm Action"
	@State private var categoryConfirmDescription = ""
	@State private var categoryConfirmLabel = "Confirm"
	@State private var categoryConfirmAction: CategoryAction?
	@State private var pendingDeleteID: UUID?

	@State private var showToast = false
	@State private var toastMessage = ""
	@State private var showMenu = false
	@State private var navigateToDashboard = false
	@State private var navigateToHistory = false
	@State private var navigateToWallets = false
	@State private var navigateToBudgets = false
	@State private var navigateToRecord = false
	@State private var navigateToProfile = false
	@State private var navigateToSettings = false

	private let colorChoices = [
		"#0F172A", "#2563EB", "#7C3AED", "#EC4899", "#DC2626", "#EA580C", "#16A34A", "#0891B2"
	]

	private var headerTotalNetWorth: Double {
		142500
	}

	private var filteredCategories: [CategoryItem] {
		if categoryFilter == "all" {
			return categories
		}
		return categories.filter { $0.type == categoryFilter }
	}

	private var incomeCount: Int {
		categories.filter { $0.type == "income" }.count
	}

	private var expenseCount: Int {
		categories.filter { $0.type == "expense" }.count
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
					createCategoryCard
					statsCard
					categoryListCard
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
		.navigationTitle("Categories")
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
			AppNavigationMenuSheet(currentRoute: .categories) { route in
				navigate(to: route)
			}
			.presentationDetents([.medium, .large])
		}
		.background {
			Group {
				NavigationLink("", isActive: $navigateToDashboard) { DashboardView() }.hidden()
				NavigationLink("", isActive: $navigateToHistory) { TransactionLedgerView() }.hidden()
				NavigationLink("", isActive: $navigateToWallets) { WalletView() }.hidden()
				NavigationLink("", isActive: $navigateToBudgets) { BudgetView() }.hidden()
				NavigationLink("", isActive: $navigateToRecord) { NewEntryView() }.hidden()
				NavigationLink("", isActive: $navigateToProfile) { AccountProfile() }.hidden()
				NavigationLink("", isActive: $navigateToSettings) { SettingView() }.hidden()
			}
		}
		.alert(categoryConfirmTitle, isPresented: $categoryConfirmOpen) {
			Button("Cancel", role: .cancel) {
				pendingDeleteID = nil
			}
			Button(categoryConfirmLabel, role: categoryConfirmAction == .delete ? .destructive : nil) {
				confirmCategoryAction()
			}
		} message: {
			Text(categoryConfirmDescription)
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("CATEGORIES")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("Taxonomy Settings")
				.font(.system(size: 30, weight: .light))

			HStack {
				VStack(alignment: .leading, spacing: 2) {
					Text("Total Net Worth".uppercased())
						.font(.system(size: 9, weight: .bold))
						.tracking(2)
						.foregroundColor(.gray)
					Text(headerTotalNetWorth, format: .currency(code: "THB"))
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

	private var createCategoryCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			cardTitle("Define New Taxonomy")

			fieldLabel("Category Name")
			appTextField("e.g. Dining Out", text: $newCategoryName)

			fieldLabel("Type")
			HStack(spacing: 10) {
				typeChip("income", selected: $newCategoryType)
				typeChip("expense", selected: $newCategoryType)
			}

			fieldLabel("Color")
			colorPalette(selectedHex: $newCategoryColor)

			if !categoriesError.isEmpty {
				Text(categoriesError)
					.font(.system(size: 11, weight: .semibold))
					.foregroundColor(.red)
			}

			Button {
				addCategory()
			} label: {
				Text(categoriesSaving ? "Processing..." : "Create Category".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.background(Color.indigo)
					.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
			}
			.disabled(categoriesSaving || categoriesLoading)
			.opacity((categoriesSaving || categoriesLoading) ? 0.65 : 1)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private var statsCard: some View {
		VStack(alignment: .leading, spacing: 10) {
			Text("Taxonomy Stats".uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(2)
				.foregroundColor(Color.white.opacity(0.65))

			HStack {
				VStack(alignment: .leading, spacing: 3) {
					Text("TOTAL")
						.font(.system(size: 10, weight: .bold))
						.foregroundColor(Color.white.opacity(0.65))
					Text("\(categories.count)")
						.font(.system(size: 24, weight: .medium))
						.foregroundColor(.white)
				}
				Spacer()
				VStack(alignment: .trailing, spacing: 3) {
					Text("INCOME / EXPENSE")
						.font(.system(size: 10, weight: .bold))
						.foregroundColor(Color.white.opacity(0.65))
					Text("\(incomeCount) / \(expenseCount)")
						.font(.system(size: 20, weight: .medium))
						.foregroundColor(.white)
				}
			}
		}
		.padding(22)
		.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
	}

	private var categoryListCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			HStack {
				cardTitle("Category Listing")
				Spacer()
				filterMenu
			}

			if categoriesLoading {
				Text("Loading categories...")
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.gray)
			}

			if !categoriesError.isEmpty {
				Text(categoriesError)
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.red)
			}

			if categoryEditOpen {
				editSection
			}

			if filteredCategories.isEmpty {
				Text("No category records found")
					.font(.system(size: 12))
					.foregroundColor(.gray)
			}

			ForEach(filteredCategories) { category in
				categoryRow(category)
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

	private var filterMenu: some View {
		Menu {
			Button("All") { categoryFilter = "all" }
			Button("Income") { categoryFilter = "income" }
			Button("Expense") { categoryFilter = "expense" }
		} label: {
			HStack(spacing: 6) {
				Text(categoryFilter.capitalized)
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

	private var editSection: some View {
		VStack(alignment: .leading, spacing: 12) {
			HStack {
				Text("Edit Category".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
				Spacer()
				Button("Close") {
					cancelEdit()
				}
				.font(.system(size: 10, weight: .semibold))
				.foregroundColor(.gray)
			}

			appTextField("Category name", text: $editCategoryName)

			HStack(spacing: 10) {
				typeChip("income", selected: $editCategoryType)
				typeChip("expense", selected: $editCategoryType)
			}

			colorPalette(selectedHex: $editCategoryColor)

			HStack(spacing: 10) {
				Button {
					requestUpdateCategory()
				} label: {
					Text("Save Changes".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.3)
						.foregroundColor(.white)
						.frame(maxWidth: .infinity)
						.padding(.vertical, 12)
						.background(Color.indigo)
						.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
				}

				Button {
					cancelEdit()
				} label: {
					Text("Cancel".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.3)
						.foregroundColor(.gray)
						.frame(maxWidth: .infinity)
						.padding(.vertical, 12)
						.overlay(
							RoundedRectangle(cornerRadius: 12)
								.stroke(Color.gray.opacity(0.22), lineWidth: 1)
						)
				}
			}
		}
		.padding(14)
		.background(Color.gray.opacity(0.07))
		.clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
	}

	private func categoryRow(_ category: CategoryItem) -> some View {
		VStack(spacing: 8) {
			HStack {
				HStack(spacing: 10) {
					Circle()
						.fill(colorFromHex(category.colorHex))
						.frame(width: 12, height: 12)
					VStack(alignment: .leading, spacing: 2) {
						Text(category.name)
							.font(.system(size: 14, weight: .semibold))
						Text(category.type.uppercased())
							.font(.system(size: 10, weight: .medium))
							.foregroundColor(.gray)
					}
				}
				Spacer()
			}

			HStack(spacing: 10) {
				Button {
					startEdit(category)
				} label: {
					Text("Edit".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.2)
						.foregroundColor(.indigo)
						.frame(maxWidth: .infinity)
						.padding(.vertical, 10)
						.overlay(
							RoundedRectangle(cornerRadius: 10)
								.stroke(Color.indigo.opacity(0.25), lineWidth: 1)
						)
				}

				Button {
					requestDelete(category)
				} label: {
					Text("Delete".uppercased())
						.font(.system(size: 10, weight: .bold))
						.tracking(1.2)
						.foregroundColor(.red)
						.frame(maxWidth: .infinity)
						.padding(.vertical, 10)
						.overlay(
							RoundedRectangle(cornerRadius: 10)
								.stroke(Color.red.opacity(0.25), lineWidth: 1)
						)
				}
			}
		}
		.padding(14)
		.background(Color.gray.opacity(0.07))
		.clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
	}

	private func addCategory() {
		let trimmed = newCategoryName.trimmingCharacters(in: .whitespacesAndNewlines)
		guard !trimmed.isEmpty else {
			categoriesError = "category-name-required"
			return
		}

		categoriesSaving = true
		categories.insert(
			.init(id: UUID(), name: trimmed, type: newCategoryType, colorHex: newCategoryColor),
			at: 0
		)
		newCategoryName = ""
		newCategoryType = "expense"
		newCategoryColor = "#0F172A"
		categoriesSaving = false
		categoriesError = ""
		showToastMessage("Category Created Successfully")
	}

	private func startEdit(_ category: CategoryItem) {
		categoryEditOpen = true
		editCategoryID = category.id
		editCategoryName = category.name
		editCategoryType = category.type
		editCategoryColor = category.colorHex
		categoriesError = ""
	}

	private func cancelEdit() {
		categoryEditOpen = false
		editCategoryID = nil
		editCategoryName = ""
		editCategoryType = "expense"
		editCategoryColor = "#0F172A"
	}

	private func requestUpdateCategory() {
		let trimmed = editCategoryName.trimmingCharacters(in: .whitespacesAndNewlines)
		guard !trimmed.isEmpty, editCategoryID != nil else {
			categoriesError = "category-name-required"
			return
		}

		categoryConfirmAction = .update
		categoryConfirmTitle = "Confirm Update Category"
		categoryConfirmDescription = "Save changes to this category?"
		categoryConfirmLabel = "Save"
		categoryConfirmOpen = true
	}

	private func requestDelete(_ category: CategoryItem) {
		pendingDeleteID = category.id
		categoryConfirmAction = .delete
		categoryConfirmTitle = "Confirm Delete Category"
		categoryConfirmDescription = "Delete category \(category.name)?"
		categoryConfirmLabel = "Delete"
		categoryConfirmOpen = true
	}

	private func confirmCategoryAction() {
		guard let action = categoryConfirmAction else { return }

		switch action {
		case .update:
			guard let id = editCategoryID else { return }
			if let idx = categories.firstIndex(where: { $0.id == id }) {
				categories[idx].name = editCategoryName.trimmingCharacters(in: .whitespacesAndNewlines)
				categories[idx].type = editCategoryType
				categories[idx].colorHex = editCategoryColor
				cancelEdit()
				showToastMessage("Category Updated Successfully")
			}

		case .delete:
			guard let id = pendingDeleteID else { return }
			categories.removeAll { $0.id == id }
			if editCategoryID == id {
				cancelEdit()
			}
			pendingDeleteID = nil
			showToastMessage("Category Deleted Successfully")
		}

		categoryConfirmAction = nil
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

	private func appTextField(_ placeholder: String, text: Binding<String>) -> some View {
		TextField(placeholder, text: text)
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

	private func typeChip(_ value: String, selected: Binding<String>) -> some View {
		Button {
			selected.wrappedValue = value
		} label: {
			Text(value.capitalized)
				.font(.system(size: 10, weight: .bold))
				.tracking(1.2)
				.foregroundColor(selected.wrappedValue == value ? .white : .gray)
				.frame(maxWidth: .infinity)
				.padding(.vertical, 11)
				.background(selected.wrappedValue == value ? Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255) : Color.gray.opacity(0.12))
				.clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
		}
	}

	private func colorPalette(selectedHex: Binding<String>) -> some View {
		HStack(spacing: 10) {
			ForEach(colorChoices, id: \.self) { hex in
				Button {
					selectedHex.wrappedValue = hex
				} label: {
					Circle()
						.fill(colorFromHex(hex))
						.frame(width: 24, height: 24)
						.overlay(
							Circle()
								.stroke(selectedHex.wrappedValue == hex ? Color.black : Color.clear, lineWidth: 2)
						)
				}
				.buttonStyle(.plain)
			}
		}
	}

	private func showToastMessage(_ message: String) {
		categoriesError = ""
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

	private func colorFromHex(_ hex: String) -> Color {
		switch hex {
		case "#2563EB": return .blue
		case "#7C3AED": return .purple
		case "#EC4899": return .pink
		case "#DC2626": return .red
		case "#EA580C": return .orange
		case "#16A34A": return .green
		case "#0891B2": return .cyan
		default: return Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255)
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
		case .budgets:
			navigateToBudgets = true
		case .record:
			navigateToRecord = true
		case .profile:
			navigateToProfile = true
		case .settings:
			navigateToSettings = true
		case .categories:
			break
		}
	}
}

#Preview {
	NavigationStack {
		CategoriesView()
	}
}

