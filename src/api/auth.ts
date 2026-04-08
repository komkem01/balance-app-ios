import * as SecureStore from "expo-secure-store";

import { ApiError, request } from "./client";

type LoginRequest = {
  username: string;
  password: string;
};

type RegisterRequest = {
  gender_id: string | null;
  prefix_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  username: string;
  password: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  member_id: string;
  username: string;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
};

type GenderItem = {
  id: string;
  name: string;
  is_active: boolean;
};

type PrefixItem = {
  id: string;
  gender_id: string;
  name: string;
  is_active: boolean;
};

type CategoryType = "income" | "expense";

type CategoryItem = {
  id: string;
  member_id: string | null;
  name: string;
  type: CategoryType;
  icon_name: string;
  color_code: string;
  created_at: string;
  updated_at: string;
};

type MeAccount = {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
};

type MeResponse = {
  id: string;
  gender_id: string | null;
  prefix_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  profile_image_url: string;
  account: MeAccount | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

type UpdateMemberRequest = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  profile_image_url?: string;
};

type ChangeMyPasswordRequest = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

type WalletItem = {
  id: string;
  member_id: string | null;
  name: string;
  balance: number;
  currency: string;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type TransactionItem = {
  id: string;
  wallet_id: string | null;
  category_id: string | null;
  amount: number;
  type: "income" | "expense";
  transaction_date: string | null;
  note: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type TransactionMonthlySummaryItem = {
  month: string;
  income_total: number;
  expense_total: number;
  transaction_count: number;
};

type TransactionMonthlySummaryParams = {
  walletID?: string;
  categoryID?: string;
  startDate?: string;
  endDate?: string;
  range?: "1d" | "1w" | "1m" | "1y" | "all";
};

type CreateTransactionRequest = {
  wallet_id: string;
  category_id?: string;
  amount: number;
  type: "income" | "expense";
  transaction_date?: string;
  note?: string;
  image_url?: string;
};

type CreateTransferTransactionRequest = {
  from_wallet_id: string;
  to_wallet_id: string;
  category_id?: string;
  amount: number;
  transaction_date?: string;
  note?: string;
};

type UploadSlipResponse = {
  image_url: string;
  display_image_url: string;
};

let session: Session | null = null;
let refreshInFlight: Promise<void> | null = null;
let initialized = false;

const SESSION_KEY = "balance_app_auth_session";
const ACCESS_REFRESH_BUFFER_MS = 30 * 1000;

const saveSession = async (next: Session) => {
  session = next;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(next));
};

const clearSession = async () => {
  session = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
};

const ensureInitialized = async () => {
  if (initialized) {
    return;
  }

  initialized = true;

  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.refreshToken) {
      await clearSession();
      return;
    }

    session = parsed;
  } catch {
    await clearSession();
  }
};

const shouldRefreshAccessToken = () => {
  if (!session?.accessExpiresAt) {
    return false;
  }

  return Date.now() + ACCESS_REFRESH_BUFFER_MS >= session.accessExpiresAt;
};

const shouldRetryWithRefresh = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return true;
    }

    const normalized = `${error.code} ${error.message}`.toLowerCase();
    return normalized.includes("token") || normalized.includes("unauthorized");
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    return normalized.includes("token") || normalized.includes("unauthorized");
  }

  return false;
};

const applyTokenPayload = async (payload: {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}) => {
  const now = Date.now();

  await saveSession({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type || "Bearer",
    accessExpiresAt: now + payload.expires_in * 1000,
    refreshExpiresAt: now + payload.refresh_expires_in * 1000,
  });
};

const refreshMemberToken = async () => {
  await ensureInitialized();

  if (refreshInFlight) {
    return await refreshInFlight;
  }

  if (!session?.refreshToken) {
    throw new Error("refresh-token-missing");
  }

  refreshInFlight = (async () => {
    const res = await request<RefreshResponse>("/public/auth/refresh", {
      method: "POST",
      body: JSON.stringify({
        refresh_token: session?.refreshToken,
      }),
    });

    await applyTokenPayload(res.data);
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

const requestWithAuth = async <T>(path: string, init?: RequestInit, allowRetry = true) => {
  await ensureInitialized();

  if (!session) {
    throw new Error("access-token-missing");
  }

  if (shouldRefreshAccessToken()) {
    try {
      await refreshMemberToken();
    } catch {
      await clearSession();
      throw new Error("access-token-expired");
    }
  }

  const tokenType = session?.tokenType || "Bearer";
  const accessToken = session?.accessToken || "";

  try {
    return await request<T>(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `${tokenType} ${accessToken}`,
      },
    });
  } catch (error) {
    if (!allowRetry || !shouldRetryWithRefresh(error)) {
      throw error;
    }

    try {
      await refreshMemberToken();
    } catch {
      await clearSession();
      throw error;
    }

    return await requestWithAuth<T>(path, init, false);
  }
};

const getAuthHeader = (): Record<string, string> => {
  if (!session?.accessToken) {
    return {};
  }

  return {
    Authorization: `${session.tokenType} ${session.accessToken}`,
  };
};

export const authApi = {
  async initSession() {
    await ensureInitialized();
  },

  async loginMember(body: LoginRequest) {
    const res = await request<LoginResponse>("/public/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await applyTokenPayload(res.data);

    return res.data;
  },

  async logout() {
    await clearSession();
  },

  async registerMember(body: RegisterRequest) {
    await request<unknown>("/public/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async listGenders() {
    const res = await request<GenderItem[]>("/systems/genders?page=1&size=100", {
      method: "GET",
    });

    return (res.data || []).filter((item) => item.is_active);
  },

  async listPrefixes() {
    const res = await request<PrefixItem[]>("/systems/prefixes?page=1&size=100", {
      method: "GET",
    });

    return (res.data || []).filter((item) => item.is_active);
  },

  async getMe() {
    const res = await requestWithAuth<MeResponse>("/me", {
      method: "GET",
      headers: getAuthHeader(),
    });

    return res.data;
  },

  async listMyCategories() {
    const res = await requestWithAuth<CategoryItem[]>("/balances/categories?page=1&size=200", {
      method: "GET",
    });

    return res.data || [];
  },

  async listMyWallets() {
    const res = await requestWithAuth<WalletItem[]>("/balances/wallets?page=1&size=100", {
      method: "GET",
    });

    return res.data || [];
  },

  async listMyTransactions(params?: { page?: number; size?: number }) {
    const page = params?.page || 1;
    const size = params?.size || 20;

    const res = await requestWithAuth<TransactionItem[]>(`/balances/transactions?page=${page}&size=${size}`, {
      method: "GET",
    });

    return res.data || [];
  },

  async listMyTransactionMonthlySummary(params?: TransactionMonthlySummaryParams) {
    const query = new URLSearchParams();

    if (params?.walletID) {
      query.set("wallet_id", params.walletID);
    }

    if (params?.categoryID) {
      query.set("category_id", params.categoryID);
    }

    if (params?.startDate) {
      query.set("start_date", params.startDate);
    }

    if (params?.endDate) {
      query.set("end_date", params.endDate);
    }

    if (params?.range) {
      query.set("range", params.range);
    }

    const queryString = query.toString();
    const path = queryString
      ? `/balances/transactions/monthly-summary?${queryString}`
      : "/balances/transactions/monthly-summary";

    const res = await requestWithAuth<TransactionMonthlySummaryItem[]>(path, {
      method: "GET",
    });

    return res.data || [];
  },

  async createMyTransaction(body: CreateTransactionRequest) {
    const res = await requestWithAuth<TransactionItem>("/balances/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return res.data;
  },

  async createMyTransferTransaction(body: CreateTransferTransactionRequest) {
    const res = await requestWithAuth<unknown>("/balances/transactions/transfer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return res.data;
  },

  async uploadMyTransactionSlip(walletID: string, file: { uri: string; fileName?: string; mimeType?: string }) {
    const formData = new FormData();
    formData.append("wallet_id", walletID);
    formData.append("image", {
      uri: file.uri,
      name: file.fileName || `slip-${Date.now()}.jpg`,
      type: file.mimeType || "image/jpeg",
    } as unknown as Blob);

    const res = await requestWithAuth<UploadSlipResponse>("/balances/storage/slips", {
      method: "POST",
      body: formData,
    });

    return res.data;
  },

  async updateMe(memberID: string, body: UpdateMemberRequest) {
    const res = await requestWithAuth<MeResponse>(`/members/${memberID}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    return res.data;
  },

  async uploadMyProfileImage(file: { uri: string; fileName?: string; mimeType?: string }) {
    const formData = new FormData();
    formData.append("image", {
      uri: file.uri,
      name: file.fileName || `profile-${Date.now()}.jpg`,
      type: file.mimeType || "image/jpeg",
    } as unknown as Blob);

    const res = await requestWithAuth<MeResponse>("/me/profile-image", {
      method: "POST",
      body: formData,
    });

    return res.data;
  },

  async changeMyPassword(body: ChangeMyPasswordRequest) {
    const res = await requestWithAuth<unknown>("/me/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return res.data;
  },
};

export type { GenderItem, PrefixItem, CategoryItem, WalletItem, TransactionItem, TransactionMonthlySummaryItem, MeResponse };
