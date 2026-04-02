//
//  WalletView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct WalletView: View {
	struct WalletItem: Identifiable, Equatable {
		let id: UUID
		var name: String
		var balance: Double
		var currency: String
		var colorCode: Color
	}

	enum WalletAction {
		case create
		case update
		case delete
	}

	@State private var wallets: [WalletItem] = [
		.init(id: UUID(), name: "Main Savings", balance: 120000, currency: "THB", colorCode: Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255)),
		.init(id: UUID(), name: "Cash on Hand", balance: 2500, currency: "THB", colorCode: .orange),
		.init(id: UUID(), name: "Investment Port", balance: 20000, currency: "THB", colorCode: .indigo)
	]

	@State private var walletsLoading = false
	@State private var walletSaving = false
	@State private var walletError = ""

	@State private var newWalletName = ""
	@State private var newWalletBalance = "0"
	@State private var newWalletCurrency = "THB"
	@State private var newWalletColorHex = "#0F172A"

	@State private var walletEditOpen = false
	@State private var editWalletID: UUID?
	@State private var editWalletName = ""
	@State private var editWalletBalance = "0"
	@State private var editWalletCurrency = "THB"
	@State private var editWalletColorHex = "#0F172A"

	@State private var walletConfirmOpen = false
	@State private var walletConfirmTitle = "Confirm Action"
	@State private var walletConfirmDescription = ""
	@State private var walletConfirmLabel = "Confirm"
	@State private var walletConfirmAction: WalletAction?
	@State private var pendingDeleteWalletID: UUID?

	@State private var showToast = false
	@State private var toastMessage = ""

	private let currencyOptions = ["THB", "USD"]
	private let walletColorChoices = [
		"#0F172A", "#2563EB", "#7C3AED", "#EC4899", "#DC2626", "#EA580C", "#16A34A", "#0891B2"
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
				VStack(alignment: .leading, spacing: 18) {
					headerSection
					createWalletCard
					inventoryCard
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
		.navigationTitle("Wallets")
		.navigationBarTitleDisplayMode(.inline)
		.alert(walletConfirmTitle, isPresented: $walletConfirmOpen) {
			Button("Cancel", role: .cancel) {
				pendingDeleteWalletID = nil
			}
			Button(walletConfirmLabel, role: walletConfirmAction == .delete ? .destructive : nil) {
				confirmWalletAction()
			}
		} message: {
			Text(walletConfirmDescription)
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("WALLETS")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("Asset Management")
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

	private var createWalletCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			cardTitle("Register New Asset")

			fieldLabel("Wallet Name")
			appTextField("e.g. Emergency Fund", text: $newWalletName)

			fieldLabel("Initial Balance")
			appTextField("0.00", text: $newWalletBalance, keyboardType: .decimalPad)

			fieldLabel("Currency")
			menuPicker(selection: $newWalletCurrency, options: currencyOptions)

			fieldLabel("Wallet Color")
			colorPalette(selectedHex: $newWalletColorHex)

			if !walletError.isEmpty {
				Text(walletError)
					.font(.system(size: 11, weight: .semibold))
					.foregroundColor(.red)
			}

			Button {
				requestCreateWallet()
			} label: {
				Text(walletSaving ? "Processing..." : "Create Wallet".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
					.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
			}
			.disabled(walletSaving || walletsLoading)
			.opacity((walletSaving || walletsLoading) ? 0.65 : 1)
		}
		.padding(22)
		.background(Color.white)
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
		.overlay(
			RoundedRectangle(cornerRadius: 28, style: .continuous)
				.stroke(Color.gray.opacity(0.12), lineWidth: 1)
		)
	}

	private var inventoryCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			cardTitle("Asset Inventory")

			if walletsLoading {
				Text("Loading wallet archive...")
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.gray)
			}

			if !walletError.isEmpty {
				Text(walletError)
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
					.foregroundColor(.red)
			}

			if walletEditOpen {
				editWalletSection
			}

			if wallets.isEmpty {
				Text("No wallet records found")
					.font(.system(size: 12))
					.foregroundColor(.gray)
					.padding(.vertical, 8)
			}

			ForEach(wallets) { wallet in
				walletRow(wallet)
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

	private var editWalletSection: some View {
		VStack(alignment: .leading, spacing: 12) {
			HStack {
				Text("Edit Wallet".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.4)
				Spacer()
				Button("Close") {
					cancelWalletEdit()
				}
				.font(.system(size: 10, weight: .semibold))
				.foregroundColor(.gray)
			}

			appTextField("Wallet name", text: $editWalletName)
			appTextField("0.00", text: $editWalletBalance, keyboardType: .decimalPad)
			menuPicker(selection: $editWalletCurrency, options: currencyOptions)
			colorPalette(selectedHex: $editWalletColorHex)

			HStack(spacing: 10) {
				Button {
					requestUpdateWallet()
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
					cancelWalletEdit()
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

	private func walletRow(_ wallet: WalletItem) -> some View {
		VStack(spacing: 8) {
			HStack {
				HStack(spacing: 10) {
					Circle()
						.fill(wallet.colorCode)
						.frame(width: 12, height: 12)

					VStack(alignment: .leading, spacing: 2) {
						Text(wallet.name)
							.font(.system(size: 14, weight: .semibold))
						Text(wallet.currency)
							.font(.system(size: 10, weight: .medium))
							.foregroundColor(.gray)
					}
				}

				Spacer()

				Text(wallet.balance, format: .currency(code: wallet.currency))
					.font(.system(size: 14, weight: .semibold))
			}

			HStack(spacing: 10) {
				Button {
					startWalletEdit(wallet)
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
					requestDeleteWallet(wallet)
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

	private func menuPicker(selection: Binding<String>, options: [String]) -> some View {
		Menu {
			ForEach(options, id: \.self) { option in
				Button(option) {
					selection.wrappedValue = option
				}
			}
		} label: {
			HStack {
				Text(selection.wrappedValue)
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
	}

	private func colorPalette(selectedHex: Binding<String>) -> some View {
		HStack(spacing: 10) {
			ForEach(walletColorChoices, id: \.self) { hex in
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

	private func requestCreateWallet() {
		let validationError = validateWalletPayload(name: newWalletName, balanceText: newWalletBalance)
		guard validationError.isEmpty else {
			walletError = validationError
			return
		}

		walletConfirmAction = .create
		walletConfirmTitle = "Confirm Create Wallet"
		walletConfirmDescription = "Create this wallet with current information?"
		walletConfirmLabel = "Create"
		walletConfirmOpen = true
	}

	private func startWalletEdit(_ wallet: WalletItem) {
		walletEditOpen = true
		editWalletID = wallet.id
		editWalletName = wallet.name
		editWalletBalance = String(format: "%.2f", wallet.balance)
		editWalletCurrency = wallet.currency
		editWalletColorHex = hexFromColor(wallet.colorCode)
		walletError = ""
	}

	private func cancelWalletEdit() {
		walletEditOpen = false
		editWalletID = nil
		editWalletName = ""
		editWalletBalance = "0"
		editWalletCurrency = "THB"
		editWalletColorHex = "#0F172A"
	}

	private func requestUpdateWallet() {
		let validationError = validateWalletPayload(name: editWalletName, balanceText: editWalletBalance)
		guard validationError.isEmpty else {
			walletError = validationError
			return
		}

		walletConfirmAction = .update
		walletConfirmTitle = "Confirm Update Wallet"
		walletConfirmDescription = "Save changes to this wallet?"
		walletConfirmLabel = "Save"
		walletConfirmOpen = true
	}

	private func requestDeleteWallet(_ wallet: WalletItem) {
		pendingDeleteWalletID = wallet.id
		walletConfirmAction = .delete
		walletConfirmTitle = "Confirm Delete Wallet"
		walletConfirmDescription = "Delete wallet \(wallet.name)?"
		walletConfirmLabel = "Delete"
		walletConfirmOpen = true
	}

	private func confirmWalletAction() {
		guard let action = walletConfirmAction else { return }

		switch action {
		case .create:
			guard let amount = Double(newWalletBalance) else {
				walletError = "wallet-balance-invalid"
				return
			}

			walletSaving = true
			wallets.insert(
				.init(
					id: UUID(),
					name: newWalletName.trimmingCharacters(in: .whitespacesAndNewlines),
					balance: normalizeTwoDecimalAmount(amount),
					currency: newWalletCurrency,
					colorCode: colorFromHex(newWalletColorHex)
				),
				at: 0
			)
			newWalletName = ""
			newWalletBalance = "0"
			newWalletCurrency = "THB"
			newWalletColorHex = "#0F172A"
			walletSaving = false
			showToastMessage("Wallet Created Successfully")

		case .update:
			guard let editID = editWalletID, let amount = Double(editWalletBalance) else {
				walletError = "wallet-update-failed"
				return
			}

			if let idx = wallets.firstIndex(where: { $0.id == editID }) {
				wallets[idx].name = editWalletName.trimmingCharacters(in: .whitespacesAndNewlines)
				wallets[idx].balance = normalizeTwoDecimalAmount(amount)
				wallets[idx].currency = editWalletCurrency
				wallets[idx].colorCode = colorFromHex(editWalletColorHex)
			}
			cancelWalletEdit()
			showToastMessage("Wallet Updated Successfully")

		case .delete:
			guard let deleteID = pendingDeleteWalletID else { return }
			wallets.removeAll { $0.id == deleteID }
			pendingDeleteWalletID = nil
			if editWalletID == deleteID {
				cancelWalletEdit()
			}
			showToastMessage("Wallet Deleted Successfully")
		}

		walletConfirmAction = nil
	}

	private func validateWalletPayload(name: String, balanceText: String) -> String {
		if name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
			return "wallet-name-required"
		}

		guard let balance = Double(balanceText) else {
			return "wallet-balance-invalid"
		}

		if balance < 0 {
			return "wallet-balance-must-be-non-negative"
		}

		let normalized = normalizeTwoDecimalAmount(balance)
		if abs(normalized - balance) > 0.0000001 {
			return "wallet-balance-must-have-two-decimals"
		}

		return ""
	}

	private func normalizeTwoDecimalAmount(_ amount: Double) -> Double {
		(amount * 100).rounded() / 100
	}

	private func showToastMessage(_ message: String) {
		walletError = ""
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

	private func hexFromColor(_ color: Color) -> String {
		if color == .blue { return "#2563EB" }
		if color == .purple { return "#7C3AED" }
		if color == .pink { return "#EC4899" }
		if color == .red { return "#DC2626" }
		if color == .orange { return "#EA580C" }
		if color == .green { return "#16A34A" }
		if color == .cyan { return "#0891B2" }
		return "#0F172A"
	}
}

#Preview {
	NavigationStack {
		WalletView()
	}
}

