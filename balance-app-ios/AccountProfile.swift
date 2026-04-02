//
//  AccountProfile.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct AccountProfile: View {
	struct MeSummary {
		var username: String
		var memberSince: String
		var lastLogin: String
		var updatedAt: String
	}

	@State private var firstName = "Johnathan"
	@State private var lastName = "Doe"
	@State private var displayName = "Johnathan Doe"
	@State private var phone = "081-234-5678"

	@State private var currentPassword = ""
	@State private var newPassword = ""
	@State private var confirmPassword = ""

	@State private var showCurrentPassword = false
	@State private var showNewPassword = false
	@State private var showConfirmPassword = false

	@State private var showProfileConfirm = false
	@State private var showPasswordConfirm = false
	@State private var showDeleteConfirm = false

	@State private var showToast = false
	@State private var toastMessage = ""

	private let summary = MeSummary(
		username: "john.doe",
		memberSince: "March 2026",
		lastLogin: "2 April 2026 10:45:12",
		updatedAt: "2 April 2026 09:31:47"
	)

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
					profileInfoCard
					securityCard
					accountSummaryCard
					dangerZoneCard
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
		.navigationTitle("Account Profile")
		.navigationBarTitleDisplayMode(.inline)
		.alert("Confirm Update", isPresented: $showProfileConfirm) {
			Button("Cancel", role: .cancel) {}
			Button("Update") {
				showToastMessage("Profile Updated Successfully")
			}
		} message: {
			Text("Save profile changes?")
		}
		.alert("Confirm Update", isPresented: $showPasswordConfirm) {
			Button("Cancel", role: .cancel) {}
			Button("Update") {
				guard !currentPassword.isEmpty, !newPassword.isEmpty, !confirmPassword.isEmpty else {
					showToastMessage("Member password required")
					return
				}

				guard newPassword == confirmPassword else {
					showToastMessage("Member password confirmation mismatch")
					return
				}

				currentPassword = ""
				newPassword = ""
				confirmPassword = ""
				showToastMessage("Password Changed Successfully")
			}
		} message: {
			Text("Change account password?")
		}
		.alert("Danger Zone", isPresented: $showDeleteConfirm) {
			Button("Cancel", role: .cancel) {}
			Button("Delete Account", role: .destructive) {
				showToastMessage("Account deactivation flow is simulated")
			}
		} message: {
			Text("This will permanently delete your account and related data. This action cannot be undone.")
		}
	}

	private var headerSection: some View {
		VStack(alignment: .leading, spacing: 8) {
			Text("PROFILE")
				.font(.system(size: 10, weight: .bold))
				.tracking(3)
				.foregroundColor(.indigo)

			Text("User Identity")
				.font(.system(size: 30, weight: .light))

			Text("Manage personal information and account security settings.")
				.font(.system(size: 12, weight: .regular))
				.foregroundColor(.gray)
		}
	}

	private var profileInfoCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			cardTitle("Profile Information")

			fieldLabel("First Name")
			profileTextField("First Name", text: $firstName)

			fieldLabel("Last Name")
			profileTextField("Last Name", text: $lastName)

			fieldLabel("Display Name")
			profileTextField("Display Name", text: $displayName)

			fieldLabel("Phone Number")
			profileTextField("081-XXX-XXXX", text: $phone, keyboardType: .phonePad)

			Button {
				showProfileConfirm = true
			} label: {
				Text("Update Profile".uppercased())
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

	private var securityCard: some View {
		VStack(alignment: .leading, spacing: 16) {
			cardTitle("Security Key")

			fieldLabel("Current Password")
			passwordField(
				"••••••••",
				text: $currentPassword,
				reveal: $showCurrentPassword
			)

			fieldLabel("New Password")
			passwordField(
				"••••••••",
				text: $newPassword,
				reveal: $showNewPassword
			)

			fieldLabel("Confirm Password")
			passwordField(
				"••••••••",
				text: $confirmPassword,
				reveal: $showConfirmPassword
			)

			Button {
				showPasswordConfirm = true
			} label: {
				Text("Change Password".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.background(Color.indigo)
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

	private var accountSummaryCard: some View {
		VStack(alignment: .leading, spacing: 12) {
			Text("Account Summary".uppercased())
				.font(.system(size: 10, weight: .bold))
				.tracking(2)
				.foregroundColor(Color.white.opacity(0.62))

			summaryLine(title: "Username", value: summary.username)
			summaryLine(title: "Member Since", value: summary.memberSince)
			summaryLine(title: "Last Login", value: summary.lastLogin)
			summaryLine(title: "Updated At", value: summary.updatedAt)
		}
		.padding(22)
		.background(Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255))
		.clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
	}

	private var dangerZoneCard: some View {
		VStack(alignment: .leading, spacing: 12) {
			cardTitle("Danger Zone")

			Text("This action will permanently remove your account and related archive data.")
				.font(.system(size: 12))
				.foregroundColor(.gray)

			Button {
				showDeleteConfirm = true
			} label: {
				Text("Deactivate Account".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(1.5)
					.foregroundColor(.red)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 14)
					.overlay(
						RoundedRectangle(cornerRadius: 14)
							.stroke(Color.red.opacity(0.35), lineWidth: 1)
					)
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

	private func summaryLine(title: String, value: String) -> some View {
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

	private func profileTextField(
		_ placeholder: String,
		text: Binding<String>,
		keyboardType: UIKeyboardType = .default
	) -> some View {
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

	private func passwordField(
		_ placeholder: String,
		text: Binding<String>,
		reveal: Binding<Bool>
	) -> some View {
		HStack {
			Group {
				if reveal.wrappedValue {
					TextField(placeholder, text: text)
				} else {
					SecureField(placeholder, text: text)
				}
			}
			.font(.system(size: 14, weight: .medium, design: .monospaced))
			.textInputAutocapitalization(.never)
			.autocorrectionDisabled()

			Button {
				reveal.wrappedValue.toggle()
			} label: {
				Image(systemName: reveal.wrappedValue ? "eye" : "eye.slash")
					.foregroundColor(.gray)
			}
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
		AccountProfile()
	}
}

