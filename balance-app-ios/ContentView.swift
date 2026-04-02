import SwiftUI

struct ContentView: View {
    private let rememberedUsernameKey = "balance_app_remembered_username"
    private let loginButtonColor = Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255)

    // MARK: - Properties
    // ตัวแปรเก็บข้อมูลฟอร์ม
    @State private var username = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var keepSignedIn = false
    
    // ตัวแปรสถานะระบบ
    @State private var isLoading = false
    @State private var message: String? = nil
    @State private var isBlinking = false // สำหรับไฟสถานะกระพริบ
    @State private var navigateToRegister = false
    @State private var navigateToDashboard = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // MARK: - Background
                // พื้นหลังสีโทนสว่าง
                Color(red: 0.97, green: 0.98, blue: 0.99)
                    .ignoresSafeArea()

                // แสงสะท้อนสีม่วงและน้ำเงิน (คล้าย Radial Gradient ในต้นฉบับ)
                Circle()
                    .fill(Color.indigo.opacity(0.1))
                    .frame(width: 400, height: 400)
                    .blur(radius: 60)
                    .offset(x: -150, y: -250)

                Circle()
                    .fill(Color.purple.opacity(0.08))
                    .frame(width: 400, height: 400)
                    .blur(radius: 60)
                    .offset(x: 150, y: 300)

                VStack {
                    Spacer()

                    // MARK: - Login Card
                    VStack(spacing: 28) {
                        // ส่วนหัว
                        VStack(spacing: 8) {
                            Text("Wealth Archive".uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .tracking(5) // ระยะห่างตัวอักษร
                                .foregroundColor(Color.gray.opacity(0.8))

                            Text("BALANCE")
                                .font(.system(size: 38, weight: .light))
                                .tracking(-1)
                                .foregroundColor(.primary)
                        }
                        .padding(.bottom, 10)

                        // ส่วนกรอกข้อมูล
                        VStack(spacing: 20) {
                            // ช่อง Username
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Identification".uppercased())
                                    .font(.system(size: 10, weight: .semibold))
                                    .tracking(2)
                                    .foregroundColor(.gray)
                                    .padding(.leading, 4)

                                TextField("Username", text: $username)
                                    .font(.system(size: 14))
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .padding()
                                    .background(Color.white.opacity(0.6))
                                    .cornerRadius(16)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                                    )
                            }

                            // ช่อง Password
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Security Key".uppercased())
                                    .font(.system(size: 10, weight: .semibold))
                                    .tracking(2)
                                    .foregroundColor(.gray)
                                    .padding(.leading, 4)

                                HStack {
                                    if showPassword {
                                        TextField("••••••••", text: $password)
                                            .font(.system(size: 14, weight: .medium, design: .monospaced))
                                            .textInputAutocapitalization(.never)
                                            .autocorrectionDisabled()
                                    } else {
                                        SecureField("••••••••", text: $password)
                                            .font(.system(size: 14, weight: .medium, design: .monospaced))
                                    }

                                    Button(action: {
                                        showPassword.toggle()
                                    }) {
                                        Image(systemName: showPassword ? "eye" : "eye.slash")
                                            .foregroundColor(.gray)
                                            .frame(width: 20, height: 20)
                                    }
                                }
                                .padding()
                                .background(Color.white.opacity(0.6))
                                .cornerRadius(16)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.gray.opacity(0.15), lineWidth: 1)
                                )
                            }

                            // Checkbox Remember me
                            HStack {
                                Button(action: {
                                    keepSignedIn.toggle()
                                }) {
                                    HStack(spacing: 10) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 4)
                                                .stroke(keepSignedIn ? Color.primary : Color.gray.opacity(0.5), lineWidth: 1)
                                                .frame(width: 16, height: 16)
                                                .background(keepSignedIn ? Color.primary : Color.clear)
                                                .cornerRadius(4)

                                            if keepSignedIn {
                                                Image(systemName: "checkmark")
                                                    .resizable()
                                                    .frame(width: 8, height: 8)
                                                    .foregroundColor(Color(UIColor.systemBackground))
                                            }
                                        }

                                        Text("Keep me signed in")
                                            .font(.system(size: 11))
                                            .foregroundColor(.gray)
                                    }
                                }
                                .buttonStyle(PlainButtonStyle())

                                Spacer()
                            }
                            .padding(.top, 4)

                            // ปุ่ม Login
                            Button(action: handleLogin) {
                                ZStack {
                                    if isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Text("Login".uppercased())
                                            .font(.system(size: 12, weight: .bold))
                                            .tracking(2)
                                    }
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(loginButtonColor)
                                .cornerRadius(16)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.black.opacity(0.08), lineWidth: 1)
                                )
                                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                            }
                            .disabled(isLoading)
                            .padding(.top, 8)
                        }

                        // ส่วน Footer Register
                        HStack(spacing: 4) {
                            Text("New to the system?")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)

                            Button("Register") {
                                navigateToRegister = true
                            }
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.primary)
                            .overlay(
                                Rectangle()
                                    .frame(height: 1)
                                    .offset(y: 8),
                                alignment: .bottom
                            )
                        }
                        .padding(.top, 20)
                    }
                    .padding(40)
                    // เอฟเฟกต์ Glassmorphism แบบเดียวกับต้นฉบับ
                    .background(.ultraThinMaterial)
                    .cornerRadius(40)
                    .overlay(
                        RoundedRectangle(cornerRadius: 40)
                            .stroke(Color.white.opacity(0.8), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.03), radius: 25, x: 0, y: 25)
                    .padding(.horizontal, 24)

                    Spacer()

                    // MARK: - System Status
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                            .opacity(isBlinking ? 1.0 : 0.4) // ไฟกระพริบ
                            .onAppear {
                                withAnimation(.easeInOut(duration: 1.0).repeatForever()) {
                                    isBlinking.toggle()
                                }
                            }

                        Text("System Operational".uppercased())
                            .font(.system(size: 9, weight: .bold))
                            .tracking(3)
                            .foregroundColor(.gray)
                    }
                    .padding(.bottom, 40)
                }

                // MARK: - Toast Message (การแจ้งเตือนมุมบนขวา)
                if let msg = message {
                    VStack {
                        HStack {
                            Spacer()
                            Text(msg)
                                .font(.system(size: 10, weight: .bold))
                                .tracking(2)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 14)
                                .background(Color.white)
                                .cornerRadius(16)
                                .shadow(color: Color.black.opacity(0.1), radius: 20, x: 0, y: 10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                                )
                                .padding(.top, 50)
                                .padding(.trailing, 24)
                        }
                        Spacer()
                    }
                    .transition(.asymmetric(
                        insertion: .move(edge: .top).combined(with: .opacity),
                        removal: .opacity
                    ))
                }

                NavigationLink("", isActive: $navigateToRegister) {
                    RegisterView()
                }
                .hidden()

                NavigationLink("", isActive: $navigateToDashboard) {
                    DashboardView()
                }
                .hidden()
            }
            .navigationBarHidden(true)
            .onAppear {
                let rememberedUsername = UserDefaults.standard.string(forKey: rememberedUsernameKey)
                if let rememberedUsername, !rememberedUsername.isEmpty {
                    username = rememberedUsername
                    keepSignedIn = true
                }
            }
            .onChange(of: keepSignedIn) { _, isRememberOn in
                if !isRememberOn {
                    UserDefaults.standard.removeObject(forKey: rememberedUsernameKey)
                }
            }
        }
    }
    
    // MARK: - Actions
    func handleLogin() {
        // ซ่อนคีย์บอร์ด
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        
        isLoading = true
        
        // จำลองการโหลดข้อมูล (เช่น เช็ค API) 1.5 วินาที
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            
            if username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || password.isEmpty {
                showMessage("PLEASE FILL ALL FIELDS")
            } else {
                if keepSignedIn {
                    UserDefaults.standard.set(username.trimmingCharacters(in: .whitespacesAndNewlines), forKey: rememberedUsernameKey)
                } else {
                    UserDefaults.standard.removeObject(forKey: rememberedUsernameKey)
                }
                showMessage("SECURITY VERIFIED")
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    navigateToDashboard = true
                }
            }
        }
    }
    
    func showMessage(_ msg: String) {
        withAnimation(.spring()) {
            message = msg
        }
        
        // ให้แจ้งเตือนหายไปเองหลัง 3 วินาที
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            withAnimation(.easeInOut) {
                message = nil
            }
        }
    }
}

#Preview {
    ContentView()
}
