//
//  NewEntryView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct NewEntryView: View {
	struct WalletItem: Identifiable {
		let id: String
		let name: String
		let balance: Double
	}

	struct CategoryItem: Identifiable {
		let id: String
		let name: String
		let type: String
	}

	enum EntryType: String {
		case income
		case expense
	}

	@State private var type: EntryType = .expense
	@State private var amountText = ""
	@State private var selectedWalletID = ""
	@State private var selectedCategoryID = ""
	@State private var transactionDate = Date()
	@State private var note = ""

	@State private var isSaving = false
	@State private var showConfirm = false
	@State private var showToast = false
	@State private var toastMessage = ""

	private let wallets: [WalletItem] = [
		.init(id: "main", name: "Main Savings", balance: 120000),
		.init(id: "cash", name: "Cash on Hand", balance: 2500),
		.init(id: "invest", name: "Investment Port", balance: 20000)
	]

	private let categories: [CategoryItem] = [
		.init(id: "food", name: "Food & Drink", type: "expense"),
		.init(id: "transport", name: "Transport", type: "expense"),
		.init(id: "shopping", name: "Shopping", type: "expense"),
		.init(id: "salary", name: "Salary", type: "income"),
		.init(id: "freelance", name: "Freelance", type: "income")
	]

	private var filteredCategories: [CategoryItem] {
		categories.filter { $0.type == type.rawValue }
	}

	private var selectedWalletBalance: Double {
		wallets.first(where: { $0.id == selectedWalletID })?.balance ?? 0
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
					entryCard
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
		.navigationTitle("New Entry")
		.navigationBarTitleDisplayMode(.inline)
		.alert("Confirm Save", isPresented: $showConfirm) {
			Button("Cancel", role: .cancel) {}
			Button("Save") {
				submitTransaction()
			}
		} message: {
			Text("Save this transaction record?")
		}
		.onChange(of: type) { _, _ in
			selectedCategoryID = ""
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("ENTRY")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("Execute Entry")
				.font(.system(size: 30, weight: .light))

			Text("Create income or expense records with account-level validation.")
				.font(.system(size: 12, weight: .regular))
				.foregroundColor(.gray)
		}
	}

	private var entryCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			cardTitle("Execute New Transaction")

			HStack(spacing: 10) {
				entryTypeChip(.income)
				entryTypeChip(.expense)
			}
			.padding(4)
			.background(Color.gray.opacity(0.12))
			.clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

			VStack(spacing: 4) {
				Text("Monetary Value".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(2)
					.foregroundColor(.gray)

				HStack(spacing: 8) {
					Text("฿")
						.font(.system(size: 22, weight: .bold))
						.foregroundColor(.gray)

					TextField("0.00", text: $amountText)
						.keyboardType(.decimalPad)
						.multilineTextAlignment(.center)
						.font(.system(size: 36, weight: .light))
						.frame(maxWidth: .infinity)
				}
				.padding(.horizontal, 16)
				.padding(.vertical, 12)
				.background(Color.gray.opacity(0.08))
				.clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
			}

			VStack(alignment: .leading, spacing: 12) {
				fieldLabel("Wallet")
				Menu {
					ForEach(wallets) { wallet in
						Button("\(wallet.name) (฿\(Int(wallet.balance)))") {
							selectedWalletID = wallet.id
						}
					}
				} label: {
					pickerButton(selectedWalletID.isEmpty ? "Select Wallet" : walletLabel(selectedWalletID))
				}

				fieldLabel("Category")
				Menu {
					ForEach(filteredCategories) { category in
						Button(category.name) {
							selectedCategoryID = category.id
						}
					}
				} label: {
					pickerButton(selectedCategoryID.isEmpty ? "Select Category" : categoryLabel(selectedCategoryID))
				}

				fieldLabel("Date")
				DatePicker("", selection: $transactionDate, displayedComponents: .date)
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
				TextEditor(text: $note)
					.frame(height: 110)
					.padding(10)
					.background(Color.white)
					.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
					.overlay(
						RoundedRectangle(cornerRadius: 12)
							.stroke(Color.gray.opacity(0.2), lineWidth: 1)
					)
			}

			Button {
				validateAndOpenConfirm()
			} label: {
				Text(isSaving ? "Processing..." : "Archive Entry".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.6)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 16)
					.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
					.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
			}
			.disabled(isSaving)
			.opacity(isSaving ? 0.65 : 1)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private func entryTypeChip(_ value: EntryType) -> some View {
		Button {
			type = value
		} label: {
			Text(value.rawValue.capitalized)
				.font(.system(size: 11, weight: .bold))
				.tracking(1.3)
				.foregroundColor(type == value ? .white : .gray)
				.frame(maxWidth: .infinity)
				.padding(.vertical, 12)
				.background(type == value ? Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255) : Color.clear)
				.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
		}
	}

	private func validateAndOpenConfirm() {
		guard let amount = Double(amountText), amount > 0 else {
			showToastMessage("transaction-amount-must-be-non-negative")
			return
		}

		let normalized = (amount * 100).rounded() / 100
		if abs(normalized - amount) > 0.0000001 {
			showToastMessage("transaction-amount-must-have-two-decimals")
			return
		}

		guard !selectedWalletID.isEmpty else {
			showToastMessage("wallet-required")
			return
		}

		guard !selectedCategoryID.isEmpty else {
			showToastMessage("category-required")
			return
		}

		if type == .expense && amount > selectedWalletBalance {
			showToastMessage("transaction-insufficient-funds")
			return
		}

		showConfirm = true
	}

	private func submitTransaction() {
		isSaving = true

		DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
			isSaving = false
			amountText = ""
			note = ""
			showToastMessage("Entry Archived Successfully")
		}
	}

	private func walletLabel(_ id: String) -> String {
		wallets.first(where: { $0.id == id }).map { "\($0.name) (฿\(Int($0.balance)))" } ?? "Select Wallet"
	}

	private func categoryLabel(_ id: String) -> String {
		filteredCategories.first(where: { $0.id == id })?.name ?? "Select Category"
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
		NewEntryView()
	}
}

