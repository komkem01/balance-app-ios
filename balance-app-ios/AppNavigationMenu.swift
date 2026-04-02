import SwiftUI

enum AppRoute: String {
    case dashboard
    case history
    case wallets
    case categories
    case budgets
    case record
    case profile
    case settings

    var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .history: return "Transaction Ledger"
        case .wallets: return "Wallets"
        case .categories: return "Categories"
        case .budgets: return "Budgets"
        case .record: return "New Transaction"
        case .profile: return "Account Profile"
        case .settings: return "Settings"
        }
    }
}

struct AppNavigationMenuSheet: View {
    let currentRoute: AppRoute
    let onSelect: (AppRoute) -> Void

    var body: some View {
        NavigationStack {
            List {
                Section("Overview") {
                    row(.dashboard)
                    row(.history)
                }

                Section("Management") {
                    row(.wallets)
                    row(.categories)
                    row(.budgets)
                }

                Section("Actions") {
                    row(.record)
                }

                Section("System") {
                    row(.profile)
                    row(.settings)
                }
            }
            .navigationTitle("Menu")
        }
    }

    private func row(_ route: AppRoute) -> some View {
        Button {
            onSelect(route)
        } label: {
            HStack {
                Text(route.title)
                Spacer()
                if currentRoute == route {
                    Image(systemName: "checkmark")
                        .foregroundStyle(.indigo)
                }
            }
        }
        .tint(.primary)
    }
}
