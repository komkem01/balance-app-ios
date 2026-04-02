//
//  register.swift
//  balance-app-ios
//
//  Created by komkem khamket on 2/4/2569 BE.
//

import SwiftUI

struct RegisterView: View {
	struct GenderItem: Identifiable {
		let id: String
		let name: String
		let isActive: Bool
	}

	struct PrefixItem: Identifiable {
		let id: String
		let genderID: String
		let name: String
		let isActive: Bool
	}

	struct RegisterForm {
		var prefixID = ""
		var genderID = ""
		var firstName = ""
		var lastName = ""
		var phone = ""
		var username = ""
		var password = ""
		var confirmPassword = ""
	}

	@Environment(\.dismiss) private var dismiss

	@State private var loading = false
	@State private var message = ""
	@State private var showToast = false
	@State private var showPassword = false
	@State private var showConfirmPassword = false
	@State private var form = RegisterForm()
	@State private var genders: [GenderItem] = []
	@State private var prefixes: [PrefixItem] = []

	private var filteredPrefixes: [PrefixItem] {
		guard !form.genderID.isEmpty else { return [] }
		return prefixes.filter { $0.genderID == form.genderID }
	}

	var body: some View {
		ZStack {
			Color(red: 0.97, green: 0.98, blue: 0.99)
				.ignoresSafeArea()

			Circle()
				.fill(Color.indigo.opacity(0.08))
				.frame(width: 420, height: 420)
				.blur(radius: 60)
				.offset(x: -160, y: -260)

			Circle()
				.fill(Color.purple.opacity(0.08))
				.frame(width: 420, height: 420)
				.blur(radius: 60)
				.offset(x: 170, y: 330)

			VStack(spacing: 0) {
				ScrollView {
					VStack(spacing: 0) {
						registerCard

						HStack(spacing: 8) {
							Circle()
								.fill(Color.green)
								.frame(width: 6, height: 6)

							Text("Encrypted Connection".uppercased())
								.font(.system(size: 9, weight: .bold))
								.tracking(3)
								.foregroundColor(.gray)
						}
						.padding(.top, 24)
					}
					.padding(.horizontal, 20)
					.padding(.vertical, 28)
				}
			}

			if showToast {
				VStack {
					HStack {
						Spacer()
						Text(message)
							.font(.system(size: 10, weight: .bold))
							.tracking(1.4)
							.textCase(.uppercase)
							.padding(.horizontal, 20)
							.padding(.vertical, 14)
							.background(Color.white)
							.cornerRadius(14)
							.overlay(
								RoundedRectangle(cornerRadius: 14)
									.stroke(Color.gray.opacity(0.15), lineWidth: 1)
							)
							.shadow(color: Color.black.opacity(0.1), radius: 20, x: 0, y: 10)
					}
					Spacer()
				}
				.padding(.top, 20)
				.padding(.horizontal, 20)
				.transition(.move(edge: .top).combined(with: .opacity))
			}
		}
		.task {
			await loadOptions()
		}
		.onChange(of: form.genderID) { _, _ in
			form.prefixID = ""
		}
	}

	private var registerCard: some View {
		VStack(spacing: 0) {
			VStack(spacing: 10) {
				Text("Create Archive".uppercased())
					.font(.system(size: 10, weight: .bold))
					.tracking(5)
					.foregroundColor(.gray)

				Text("Register".uppercased())
					.font(.system(size: 36, weight: .light))
					.tracking(-1)
					.foregroundColor(.primary)
			}
			.padding(.bottom, 34)

			VStack(spacing: 28) {
				VStack(alignment: .leading, spacing: 14) {
					sectionTitle("Personal Detail")

					VStack(spacing: 16) {
						fieldLabel("Gender")
						Menu {
							ForEach(genders.filter(\.isActive)) { gender in
								Button(gender.name) {
									form.genderID = gender.id
								}
							}
						} label: {
							pickerButton(title: selectedGenderName ?? "Select Gender")
						}

						fieldLabel("Prefix")
						Menu {
							ForEach(filteredPrefixes.filter(\.isActive)) { prefix in
								Button(prefix.name) {
									form.prefixID = prefix.id
								}
							}
						} label: {
							pickerButton(title: selectedPrefixLabel)
						}
						.disabled(form.genderID.isEmpty || filteredPrefixes.isEmpty)

						fieldLabel("First Name")
						textField("Your first name", text: $form.firstName)

						fieldLabel("Last Name")
						textField("Your last name", text: $form.lastName)

						fieldLabel("Phone Number")
						textField("081-XXX-XXXX", text: $form.phone, keyboardType: .phonePad)
					}
				}

				VStack(alignment: .leading, spacing: 14) {
					sectionTitle("Account Credential")

					VStack(spacing: 16) {
						fieldLabel("Username")
						textField("Choose a username", text: $form.username)

						fieldLabel("Password")
						passwordField(
							placeholder: "••••••••",
							text: $form.password,
							reveal: $showPassword
						)

						fieldLabel("Confirm Password")
						passwordField(
							placeholder: "••••••••",
							text: $form.confirmPassword,
							reveal: $showConfirmPassword
						)
					}
				}

				Button(action: handleRegister) {
					ZStack {
						if loading {
							ProgressView()
								.progressViewStyle(CircularProgressViewStyle(tint: .white))
						} else {
							Text("Create Account".uppercased())
								.font(.system(size: 12, weight: .bold))
								.tracking(3)
						}
					}
					.foregroundColor(.white)
					.frame(maxWidth: .infinity)
					.padding(.vertical, 18)
					.background(Color.black.opacity(0.86))
					.cornerRadius(16)
				}
				.disabled(loading)
				.opacity(loading ? 0.6 : 1)

				HStack(spacing: 4) {
					Text("Already have an archive?")
						.font(.system(size: 12))
						.foregroundColor(.gray)

					Button("Login") {
						dismiss()
					}
					.font(.system(size: 12, weight: .semibold))
					.foregroundColor(.black)
				}
				.padding(.top, 6)
			}
		}
		.padding(28)
		.background(.ultraThinMaterial)
		.cornerRadius(34)
		.overlay(
			RoundedRectangle(cornerRadius: 34)
				.stroke(Color.white.opacity(0.9), lineWidth: 1)
		)
		.shadow(color: Color.black.opacity(0.04), radius: 24, x: 0, y: 20)
	}

	private var selectedGenderName: String? {
		genders.first(where: { $0.id == form.genderID })?.name
	}

	private var selectedPrefixLabel: String {
		if form.genderID.isEmpty {
			return "Select Gender first"
		}
		if filteredPrefixes.isEmpty {
			return "No prefix available"
		}
		return prefixes.first(where: { $0.id == form.prefixID })?.name ?? "Select Prefix"
	}

	private func sectionTitle(_ title: String) -> some View {
		Text(title.uppercased())
			.font(.system(size: 11, weight: .bold))
			.tracking(2.2)
			.foregroundColor(.black)
			.frame(maxWidth: .infinity, alignment: .leading)
			.padding(.bottom, 8)
			.overlay(alignment: .bottom) {
				Rectangle()
					.fill(Color.gray.opacity(0.2))
					.frame(height: 1)
			}
	}

	private func fieldLabel(_ title: String) -> some View {
		Text(title.uppercased())
			.font(.system(size: 10, weight: .semibold))
			.tracking(2)
			.foregroundColor(.gray)
			.frame(maxWidth: .infinity, alignment: .leading)
			.padding(.leading, 2)
	}

	private func textField(
		_ placeholder: String,
		text: Binding<String>,
		keyboardType: UIKeyboardType = .default
	) -> some View {
		TextField(placeholder, text: text)
			.keyboardType(keyboardType)
			.textInputAutocapitalization(.never)
			.autocorrectionDisabled()
			.font(.system(size: 14))
			.padding(.horizontal, 18)
			.padding(.vertical, 14)
			.background(Color.white.opacity(0.92))
			.cornerRadius(16)
			.overlay(
				RoundedRectangle(cornerRadius: 16)
					.stroke(Color(red: 0.8, green: 0.84, blue: 0.9), lineWidth: 1)
			)
	}

	private func pickerButton(title: String) -> some View {
		HStack {
			Text(title)
				.foregroundColor(.black.opacity(0.86))
				.font(.system(size: 14))
			Spacer()
			Image(systemName: "chevron.down")
				.font(.system(size: 12, weight: .semibold))
				.foregroundColor(.gray)
		}
		.padding(.horizontal, 18)
		.padding(.vertical, 14)
		.background(Color.white)
		.cornerRadius(16)
		.overlay(
			RoundedRectangle(cornerRadius: 16)
				.stroke(Color(red: 0.8, green: 0.84, blue: 0.9), lineWidth: 1)
		)
	}

	private func passwordField(
		placeholder: String,
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
		.padding(.horizontal, 18)
		.padding(.vertical, 14)
		.background(Color.white.opacity(0.92))
		.cornerRadius(16)
		.overlay(
			RoundedRectangle(cornerRadius: 16)
				.stroke(Color(red: 0.8, green: 0.84, blue: 0.9), lineWidth: 1)
		)
	}

	private func showMessage(_ value: String) {
		withAnimation(.spring()) {
			message = value
			showToast = true
		}

		DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
			withAnimation(.easeInOut) {
				showToast = false
				message = ""
			}
		}
	}

	private func loadOptions() async {
		do {
			let data = try await MockAuthService().loadRegisterOptions()
			genders = data.genders.filter(\.isActive)
			prefixes = data.prefixes.filter(\.isActive)
		} catch {
			showMessage(error.localizedDescription)
		}
	}

	private func handleRegister() {
		guard !form.firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
			  !form.lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
			  !form.phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
			  !form.username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
			  !form.password.isEmpty,
			  !form.confirmPassword.isEmpty else {
			showMessage("Please fill all required fields")
			return
		}

		guard form.password == form.confirmPassword else {
			showMessage("Passwords do not match")
			return
		}

		loading = true

		Task {
			defer { loading = false }

			do {
				try await MockAuthService().registerMember(form: form)
				showMessage("Account Created Successfully")
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
					dismiss()
				}
			} catch {
				showMessage(error.localizedDescription)
			}
		}
	}
}

private struct MockAuthService {
	struct RegisterOptions {
		let genders: [RegisterView.GenderItem]
		let prefixes: [RegisterView.PrefixItem]
	}

	func loadRegisterOptions() async throws -> RegisterOptions {
		try await Task.sleep(nanoseconds: 250_000_000)

		let genders: [RegisterView.GenderItem] = [
			.init(id: "male", name: "Male", isActive: true),
			.init(id: "female", name: "Female", isActive: true),
			.init(id: "other", name: "Other", isActive: true)
		]

		let prefixes: [RegisterView.PrefixItem] = [
			.init(id: "mr", genderID: "male", name: "Mr.", isActive: true),
			.init(id: "ms", genderID: "female", name: "Ms.", isActive: true),
			.init(id: "mrs", genderID: "female", name: "Mrs.", isActive: true),
			.init(id: "mx", genderID: "other", name: "Mx.", isActive: true)
		]

		return RegisterOptions(genders: genders, prefixes: prefixes)
	}

	func registerMember(form: RegisterView.RegisterForm) async throws {
		_ = form
		try await Task.sleep(nanoseconds: 800_000_000)
	}
}

#Preview {
	RegisterView()
}

