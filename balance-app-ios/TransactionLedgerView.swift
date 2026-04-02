//
//  TransactionLedgerView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct TransactionLedgerView: View {
	struct LedgerItem: Identifiable {
		let id: UUID
		var walletID: String
		var categoryID: String
		var transactionDate: Date
		var category: String
		var note: String
		var amount: Double
		var type: TransactionType
		var wallet: String
	}

	enum TransactionType: String {
		case income
		case expense
	}

	enum HistoryFilter: String {
		case all
		case income
		case expense
	}

	struct WalletItem: Identifiable {
		let id: String
		let name: String
	}

	struct CategoryItem: Identifiable {
		let id: String
		let name: String
		let type: TransactionType
	}

	@State private var allTransactions: [LedgerItem] = [
		.init(id: UUID(), walletID: "main", categoryID: "food", transactionDate: Date(), category: "Food & Drink", note: "Starbucks Coffee", amount: 145, type: .expense, wallet: "Cash"),
		.init(id: UUID(), walletID: "main", categoryID: "salary", transactionDate: Date().addingTimeInterval(-86400), category: "Salary", note: "Monthly Revenue", amount: 45000, type: .income, wallet: "Savings"),
		.init(id: UUID(), walletID: "cash", categoryID: "transport", transactionDate: Date().addingTimeInterval(-172800), category: "Transport", note: "Grab Ride", amount: 220, type: .expense, wallet: "Cash"),
		.init(id: UUID(), walletID: "main", categoryID: "shopping", transactionDate: Date().addingTimeInterval(-259200), category: "Shopping", note: "Uniqlo Store", amount: 1290, type: .expense, wallet: "Savings"),
		.init(id: UUID(), walletID: "cash", categoryID: "food", transactionDate: Date().addingTimeInterval(-345600), category: "Food & Drink", note: "Dinner at Shabu", amount: 850, type: .expense, wallet: "Cash"),
		.init(id: UUID(), walletID: "invest", categoryID: "freelance", transactionDate: Date().addingTimeInterval(-432000), category: "Freelance", note: "Logo Design Project", amount: 5000, type: .income, wallet: "Investment")
	]

	@State private var historyFilter: HistoryFilter = .all
	@State private var pageLoading = false
	@State private var actionLoading = false
	@State private var actionError = ""

	@State private var currentPage = 1
	private let itemsPerPage = 6

	@State private var editModalOpen = false
	@State private var deleteConfirmOpen = false
	@State private var deleteTargetID: UUID?

	@State private var editID: UUID?
	@State private var editType: TransactionType = .expense
	@State private var editAmountText = ""
	@State private var editWalletID = ""
	@State private var editCategoryID = ""
	@State private var editDate = Date()
	@State private var editNote = ""

	@State private var showToast = false
	@State private var toastMessage = ""

	private let wallets: [WalletItem] = [
		.init(id: "main", name: "Main Savings"),
		.init(id: "cash", name: "Cash on Hand"),
		.init(id: "invest", name: "Investment Port")
	]

	private let categories: [CategoryItem] = [
		.init(id: "food", name: "Food & Drink", type: .expense),
		.init(id: "transport", name: "Transport", type: .expense),
		.init(id: "shopping", name: "Shopping", type: .expense),
		.init(id: "salary", name: "Salary", type: .income),
		.init(id: "freelance", name: "Freelance", type: .income)
	]

	private var headerTotalNetWorth: Double {
		142500
	}

	private var filteredTransactions: [LedgerItem] {
		switch historyFilter {
		case .all:
			return allTransactions
		case .income:
			return allTransactions.filter { $0.type == .income }
		case .expense:
			return allTransactions.filter { $0.type == .expense }
		}
	}

	private var totalTransactions: Int {
		filteredTransactions.count
	}

	private var totalPages: Int {
		max(1, Int(ceil(Double(totalTransactions) / Double(itemsPerPage))))
	}

	private var paginatedTransactions: [LedgerItem] {
		let start = (currentPage - 1) * itemsPerPage
		let end = min(start + itemsPerPage, filteredTransactions.count)
		guard start < end else { return [] }
		return Array(filteredTransactions[start..<end])
	}

	private var displayStart: Int {
		totalTransactions == 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1
	}

	private var displayEnd: Int {
		min(currentPage * itemsPerPage, totalTransactions)
	}

	private var editCategoryOptions: [CategoryItem] {
		categories.filter { $0.type == editType }
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
					historyCard
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
		.navigationTitle("Transaction Ledger")
		.navigationBarTitleDisplayMode(.inline)
		.sheet(isPresented: $editModalOpen) {
			editTransactionSheet
		}
		.alert("Confirm Delete", isPresented: $deleteConfirmOpen) {
			Button("Cancel", role: .cancel) {
				deleteTargetID = nil
			}
			Button("Delete", role: .destructive) {
				confirmDeleteTransaction()
			}
		} message: {
			Text("Delete this transaction?")
		}
		.onChange(of: historyFilter) { _, _ in
			currentPage = 1
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("HISTORY")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("Transaction Ledger")
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

	private var historyCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			HStack {
				HStack(spacing: 8) {
					filterChip(.all, label: "All Activity")
					filterChip(.income, label: "Income")
					filterChip(.expense, label: "Expenses")
				}
				Spacer()
				Text("Displaying \(displayStart)-\(displayEnd) of \(totalTransactions) Records")
					.font(.system(size: 10, weight: .bold))
					.tracking(1.1)
					.foregroundColor(.gray)
			}

			if pageLoading {
				Text("Loading data...")
					.font(.system(size: 11, weight: .semibold))
					.foregroundColor(.gray)
			}

			if !actionError.isEmpty {
				Text(actionError)
					.font(.system(size: 11, weight: .semibold))
					.foregroundColor(.red)
			}

			if paginatedTransactions.isEmpty {
				Text("No records found")
					.font(.system(size: 12))
					.foregroundColor(.gray)
			}

			ForEach(paginatedTransactions) { item in
				transactionRow(item)
			}

			HStack {
				Button("Previous Archive") {
					prevPage()
				}
				.font(.system(size: 10, weight: .bold))
				.tracking(1.2)
				.foregroundColor(currentPage == 1 ? .gray.opacity(0.4) : .gray)
				.disabled(currentPage == 1)

				Spacer()

				Text("Page \(currentPage) of \(totalPages)")
					.font(.system(size: 10, weight: .bold))
					.foregroundColor(.gray)

				Spacer()

				Button("Next Archive") {
					nextPage()
				}
				.font(.system(size: 10, weight: .bold))
				.tracking(1.2)
				.foregroundColor(currentPage >= totalPages ? .gray.opacity(0.4) : .gray)
				.disabled(currentPage >= totalPages)
			}
			.padding(.top, 6)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private func filterChip(_ value: HistoryFilter, label: String) -> some View {
		Button {
			historyFilter = value
		} label: {
			Text(label.uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(1.1)
				.foregroundColor(historyFilter == value ? .black : .gray)
				.padding(.horizontal, 10)
				.padding(.vertical, 8)
				.background(historyFilter == value ? Color.black.opacity(0.08) : Color.clear)
				.clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
		}
	}

	private func transactionRow(_ item: LedgerItem) -> some View {
		HStack(alignment: .top) {
			VStack(alignment: .leading, spacing: 4) {
				Text(formatDate(item.transactionDate).uppercased())
					.font(.system(size: 9, weight: .bold))
					.foregroundColor(.gray)

				Text(item.note.isEmpty ? item.category : item.note)
					.font(.system(size: 14, weight: .semibold))

				Text("\(item.category) • \(item.wallet)")
					.font(.system(size: 10, weight: .medium))
					.foregroundColor(.gray)
			}

			Spacer()

			VStack(alignment: .trailing, spacing: 8) {
				Text((item.type == .expense ? "-" : "+") + String(format: "%.2f", item.amount))
					.font(.system(size: 14, weight: .semibold))
					.foregroundColor(item.type == .expense ? .red : .green)

				HStack(spacing: 8) {
					Button("Edit") {
						openEditTransaction(item)
					}
					.font(.system(size: 10, weight: .bold))
					.foregroundColor(.indigo)

					Button("Delete") {
						requestDeleteTransaction(item)
					}
					.font(.system(size: 10, weight: .bold))
					.foregroundColor(.red)
				}
			}
		}
		.padding(12)
		.background(Color.gray.opacity(0.06))
		.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
	}

	private var editTransactionSheet: some View {
		NavigationStack {
			ScrollView {
				VStack(alignment: .leading, spacing: 14) {
					fieldLabel("Type")
					HStack(spacing: 10) {
						editTypeChip(.income)
						editTypeChip(.expense)
					}

					fieldLabel("Amount")
					appTextField("0.00", text: $editAmountText, keyboardType: .decimalPad)

					fieldLabel("Wallet")
					Menu {
						ForEach(wallets) { wallet in
							Button(wallet.name) {
								editWalletID = wallet.id
							}
						}
					} label: {
						pickerButton(editWalletID.isEmpty ? "Select Wallet" : walletLabel(editWalletID))
					}

					fieldLabel("Category")
					Menu {
						ForEach(editCategoryOptions) { category in
							Button(category.name) {
								editCategoryID = category.id
							}
						}
					} label: {
						pickerButton(editCategoryID.isEmpty ? "Select Category" : categoryLabel(editCategoryID))
					}

					fieldLabel("Transaction Date")
					DatePicker("", selection: $editDate, displayedComponents: .date)
						.labelsHidden()
						.datePickerStyle(.compact)
						.frame(maxWidth: .infinity, alignment: .leading)
						.padding(.horizontal, 14)
						.padding(.vertical, 12)
						.background(Color.white)
						.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
						.overlay(
							RoundedRectangle(cornerRadius: 12)
								.stroke(Color.gray.opacity(0.2), lineWidth: 1)
						)

					fieldLabel("Note")
					appTextField("Optional note", text: $editNote)

					if !actionError.isEmpty {
						Text(actionError)
							.font(.system(size: 11, weight: .semibold))
							.foregroundColor(.red)
					}

					Button {
						saveEditedTransaction()
					} label: {
						Text(actionLoading ? "Saving..." : "Save")
							.font(.system(size: 11, weight: .bold))
							.foregroundColor(.white)
							.frame(maxWidth: .infinity)
							.padding(.vertical, 14)
							.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
							.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
					}
					.disabled(actionLoading)
				}
				.padding(20)
			}
			.navigationTitle("Edit Transaction")
			.navigationBarTitleDisplayMode(.inline)
			.toolbar {
				ToolbarItem(placement: .topBarTrailing) {
					Button("Close") {
						closeEditModal()
					}
				}
			}
		}
	}

	private func editTypeChip(_ value: TransactionType) -> some View {
		Button {
			editType = value
			if !editCategoryOptions.contains(where: { $0.id == editCategoryID }) {
				editCategoryID = ""
			}
		} label: {
			Text(value.rawValue.capitalized)
				.font(.system(size: 10, weight: .bold))
				.foregroundColor(editType == value ? .white : .gray)
				.frame(maxWidth: .infinity)
				.padding(.vertical, 10)
				.background(editType == value ? Color.black.opacity(0.85) : Color.gray.opacity(0.12))
				.clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
		}
	}

	private func openEditTransaction(_ item: LedgerItem) {
		actionError = ""
		editID = item.id
		editWalletID = item.walletID
		editCategoryID = item.categoryID
		editAmountText = String(format: "%.2f", item.amount)
		editType = item.type
		editDate = item.transactionDate
		editNote = item.note
		editModalOpen = true
	}

	private func closeEditModal() {
		editModalOpen = false
	}

	private func requestDeleteTransaction(_ item: LedgerItem) {
		deleteTargetID = item.id
		deleteConfirmOpen = true
	}

	private func confirmDeleteTransaction() {
		guard let target = deleteTargetID else { return }
		allTransactions.removeAll { $0.id == target }
		if currentPage > totalPages {
			currentPage = totalPages
		}
		deleteTargetID = nil
		showToastMessage("Transaction Deleted")
	}

	private func saveEditedTransaction() {
		guard let id = editID else { return }
		guard let amount = Double(editAmountText), amount >= 0 else {
			actionError = "transaction-amount-must-be-non-negative"
			return
		}

		let normalized = (amount * 100).rounded() / 100
		if abs(normalized - amount) > 0.0000001 {
			actionError = "transaction-amount-must-have-two-decimals"
			return
		}

		guard !editWalletID.isEmpty, !editCategoryID.isEmpty else {
			actionError = "wallet-and-category-required"
			return
		}

		actionLoading = true
		if let idx = allTransactions.firstIndex(where: { $0.id == id }) {
			allTransactions[idx].walletID = editWalletID
			allTransactions[idx].categoryID = editCategoryID
			allTransactions[idx].amount = normalized
			allTransactions[idx].type = editType
			allTransactions[idx].transactionDate = editDate
			allTransactions[idx].note = editNote
			allTransactions[idx].wallet = walletLabel(editWalletID)
			allTransactions[idx].category = categoryLabel(editCategoryID)
		}
		actionLoading = false
		editModalOpen = false
		actionError = ""
		showToastMessage("Transaction Updated")
	}

	private func prevPage() {
		if currentPage > 1 {
			currentPage -= 1
		}
	}

	private func nextPage() {
		if currentPage < totalPages {
			currentPage += 1
		}
	}

	private func walletLabel(_ id: String) -> String {
		wallets.first(where: { $0.id == id })?.name ?? "Unknown Wallet"
	}

	private func categoryLabel(_ id: String) -> String {
		categories.first(where: { $0.id == id })?.name ?? "Unknown Category"
	}

	private func formatDate(_ date: Date) -> String {
		let formatter = DateFormatter()
		formatter.dateFormat = "d MMM yyyy"
		return formatter.string(from: date)
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
}

#Preview {
	NavigationStack {
		TransactionLedgerView()
	}
}

