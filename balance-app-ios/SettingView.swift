//
//  SettingView.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct SettingView: View {
	struct NotificationSetting: Identifiable {
		let id: String
		let title: String
		let subtitle: String
		var isOn: Bool
	}

	@State private var preferredCurrency = "THB"
	@State private var preferredLanguage = "EN"
	@State private var showSaveConfirm = false
	@State private var showToast = false
	@State private var toastMessage = ""
	@State private var showMenu = false
	@State private var navigateToDashboard = false
	@State private var navigateToHistory = false
	@State private var navigateToWallets = false
	@State private var navigateToCategories = false
	@State private var navigateToBudgets = false
	@State private var navigateToRecord = false
	@State private var navigateToProfile = false
	@State private var notifications: [NotificationSetting] = [
		.init(id: "budget", title: "Budget Alerts", subtitle: "Notify when spending reaches limit", isOn: true),
		.init(id: "security", title: "Security Events", subtitle: "Sign-in and account security updates", isOn: true),
		.init(id: "weekly", title: "Weekly Summary", subtitle: "Weekly finance digest and trend report", isOn: false)
	]

	private let currencyOptions: [(value: String, label: String)] = [
		("THB", "THB - Thai Baht (฿)"),
		("USD", "USD - US Dollar ($)"),
		("EUR", "EUR - Euro (€)")
	]

	private let languageOptions: [(value: String, label: String)] = [
		("EN", "English (US)"),
		("TH", "ไทย (Thai)")
	]

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
					regionalCard
					notificationsCard
					dataManagementCard
					systemAboutCard
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
							.tracking(1.8)
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
		.navigationTitle("Settings")
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
			AppNavigationMenuSheet(currentRoute: .settings) { route in
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
				NavigationLink("", isActive: $navigateToBudgets) { BudgetView() }.hidden()
				NavigationLink("", isActive: $navigateToRecord) { NewEntryView() }.hidden()
				NavigationLink("", isActive: $navigateToProfile) { AccountProfile() }.hidden()
			}
		}
		.alert("Confirm Update", isPresented: $showSaveConfirm) {
			Button("Cancel", role: .cancel) {}
			Button("Save") {
				showToastMessage("Settings saved successfully")
			}
		} message: {
			Text("Save system settings?")
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("SETTINGS")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("System Preferences")
				.font(.system(size: 30, weight: .light))

			Text("Adjust locale, alerts, and data controls for your account.")
				.font(.system(size: 12, weight: .regular))
				.foregroundColor(.gray)
		}
	}

	private var regionalCard: some View {
		VStack(alignment: .leading, spacing: 18) {
			cardTitle("Regional & Preferences")

			VStack(alignment: .leading, spacing: 8) {
				fieldLabel("Preferred Currency")
				Picker("Preferred Currency", selection: $preferredCurrency) {
					ForEach(currencyOptions, id: \.value) { option in
						Text(option.label).tag(option.value)
					}
				}
				.pickerStyle(.menu)
				.frame(maxWidth: .infinity, alignment: .leading)
				.padding(.horizontal, 14)
				.padding(.vertical, 12)
				.background(Color.white)
				.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
				.overlay(
					RoundedRectangle(cornerRadius: 12)
						.stroke(Color.gray.opacity(0.2), lineWidth: 1)
				)
			}

			VStack(alignment: .leading, spacing: 8) {
				fieldLabel("Preferred Language")
				Picker("Preferred Language", selection: $preferredLanguage) {
					ForEach(languageOptions, id: \.value) { option in
						Text(option.label).tag(option.value)
					}
				}
				.pickerStyle(.menu)
				.frame(maxWidth: .infinity, alignment: .leading)
				.padding(.horizontal, 14)
				.padding(.vertical, 12)
				.background(Color.white)
				.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
				.overlay(
					RoundedRectangle(cornerRadius: 12)
						.stroke(Color.gray.opacity(0.2), lineWidth: 1)
				)
			}

			Button {
				showSaveConfirm = true
			} label: {
				Text("Save Settings".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
					.clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
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

	private var notificationsCard: some View {
		VStack(alignment: .leading, spacing: 18) {
			cardTitle("Notification Signals")

			ForEach(notifications.indices, id: \.self) { index in
				HStack(alignment: .top, spacing: 12) {
					VStack(alignment: .leading, spacing: 4) {
						Text(notifications[index].title)
							.font(.system(size: 13, weight: .semibold))
						Text(notifications[index].subtitle)
							.font(.system(size: 11, weight: .regular))
							.foregroundColor(.gray)
					}

					Spacer()

					Toggle("", isOn: $notifications[index].isOn)
						.labelsHidden()
						.tint(.indigo)
				}

				if index != notifications.indices.last {
					Divider()
						.overlay(Color.gray.opacity(0.14))
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

	private var dataManagementCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			cardTitle("Data Management")

			Text("Export tools and archive commands are currently simulated in iOS preview mode.")
				.font(.system(size: 12))
				.foregroundColor(.gray)

			HStack(spacing: 10) {
				smallActionButton("Export CSV") {
					showToastMessage("Export CSV is under development")
				}
				smallActionButton("Export JSON") {
					showToastMessage("Export JSON is under development")
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

	private var systemAboutCard: some View {
		VStack(alignment: .leading, spacing: 14) {
			Text("System About".uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(2)
				.foregroundColor(Color.white.opacity(0.62))

			infoLine(title: "Version", value: "1.0.0")
			infoLine(title: "Encrypted", value: "Enabled")
			infoLine(title: "Region", value: preferredLanguage == "TH" ? "Thailand" : "Global")
			infoLine(title: "Currency", value: preferredCurrency)
		}
		.padding(22)
		.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
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
			.tracking(1.5)
			.foregroundColor(.gray)
	}

	private func infoLine(title: String, value: String) -> some View {
		HStack {
			Text(title.uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(1.2)
				.foregroundColor(Color.white.opacity(0.62))
			Spacer()
			Text(value)
				.font(.system(size: 12, weight: .semibold))
				.foregroundColor(.white)
		}
		.padding(.vertical, 2)
	}

	private func smallActionButton(_ title: String, action: @escaping () -> Void) -> some View {
		Button(action: action) {
			Text(title.uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(1.2)
				.foregroundColor(.black.opacity(0.75))
				.frame(maxWidth: .infinity)
				.padding(.vertical, 12)
				.background(Color.gray.opacity(0.1))
				.clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
		}
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
		case .budgets:
			navigateToBudgets = true
		case .record:
			navigateToRecord = true
		case .profile:
			navigateToProfile = true
		case .settings:
			break
		}
	}
}

#Preview {
	NavigationStack {
		SettingView()
	}
}

