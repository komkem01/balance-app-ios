import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { authApi } from "../api/auth";
import { AppCard } from "../components/AppCard";
import { AppInput } from "../components/AppInput";
import { AppScreen } from "../components/AppScreen";
import { AppSelect } from "../components/AppSelect";
import { theme } from "../theme";

type RecordType = "expense" | "income" | "transfer";

type QuickEntryScreenProps = {
  totalNetWorth?: number;
  wallets: Array<{ id: string; name: string; amount: number }>;
  categories: Array<{ id: string; name: string; type: "income" | "expense" }>;
  onOpenSidebar: () => void;
  onSubmitted: () => Promise<void> | void;
  onBack: () => void;
};

const toDateOnly = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidAmount = (amount: number) => Number.isFinite(amount) && amount >= 0 && Number(amount.toFixed(2)) === amount;

export function QuickEntryScreen({
  totalNetWorth = 0,
  wallets,
  categories,
  onOpenSidebar,
  onSubmitted,
  onBack,
}: QuickEntryScreenProps) {
  const [recordType, setRecordType] = useState<RecordType>("expense");
  const [amount, setAmount] = useState("");
  const [walletID, setWalletID] = useState("");
  const [categoryID, setCategoryID] = useState("");
  const [toWalletID, setToWalletID] = useState("");
  const [date, setDate] = useState(toDateOnly(new Date()));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateDraft, setDateDraft] = useState(date);
  const [slipSourceModalVisible, setSlipSourceModalVisible] = useState(false);
  const [submitConfirmVisible, setSubmitConfirmVisible] = useState(false);

  const [slipUploading, setSlipUploading] = useState(false);
  const [uploadedSlipURL, setUploadedSlipURL] = useState("");
  const [slipPreviewURL, setSlipPreviewURL] = useState("");
  const [slipFileName, setSlipFileName] = useState("");

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 1800);

    return () => {
      clearTimeout(timer);
    };
  }, [successMessage]);

  const totalNetWorthText = `THB ${Math.abs(totalNetWorth).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const walletOptions = useMemo(
    () => wallets.map((wallet) => ({ label: wallet.name, value: wallet.id })),
    [wallets]
  );

  const categoryOptions = useMemo(() => {
    if (recordType === "transfer") {
      return [{ label: "Transfer", value: "" }];
    }

    return categories
      .filter((item) => item.type === recordType)
      .map((item) => ({ label: item.name, value: item.id }));
  }, [categories, recordType]);

  const destinationWalletOptions = useMemo(
    () => walletOptions.filter((wallet) => wallet.value !== walletID),
    [walletOptions, walletID]
  );

  const resetForm = () => {
    setAmount("");
    setCategoryID("");
    setToWalletID("");
    setNote("");
    setUploadedSlipURL("");
    setSlipPreviewURL("");
    setSlipFileName("");
  };

  const prepareSlipAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    const maxWidth = 1400;
    const resizeAction = asset.width && asset.width > maxWidth
      ? [{ resize: { width: maxWidth } }]
      : [];

    const result = await manipulateAsync(asset.uri, resizeAction, {
      compress: 0.72,
      format: SaveFormat.JPEG,
      base64: false,
    });

    return {
      uri: result.uri,
      fileName: asset.fileName || `slip-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    };
  };

  const uploadSlipFromAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setSlipUploading(true);

    try {
      const prepared = await prepareSlipAsset(asset);

      const res = await authApi.uploadMyTransactionSlip(walletID, {
        uri: prepared.uri,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
      });

      setUploadedSlipURL(res.image_url || "");
      setSlipPreviewURL(res.display_image_url || res.image_url || asset.uri);
      setSlipFileName(asset.fileName || "transaction-slip.jpg");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to upload slip.");
      }
      setUploadedSlipURL("");
      setSlipPreviewURL("");
      setSlipFileName("");
    } finally {
      setSlipUploading(false);
    }
  };

  const pickSlipFromLibrary = async () => {
    setErrorMessage("");

    if (!walletID) {
      setErrorMessage("Please select wallet before attaching slip.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Photo permission is required to attach slip.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    await uploadSlipFromAsset(result.assets[0]);
  };

  const pickSlipFromCamera = async () => {
    setErrorMessage("");

    if (!walletID) {
      setErrorMessage("Please select wallet before attaching slip.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Camera permission is required to capture slip.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    await uploadSlipFromAsset(result.assets[0]);
  };

  const submitTransaction = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const amountValue = Number(amount);
    if (!walletID) {
      setErrorMessage("Wallet is required.");
      return;
    }
    if (!Number.isFinite(amountValue) || !isValidAmount(amountValue)) {
      setErrorMessage("Amount must be a non-negative number with up to 2 decimals.");
      return;
    }
    if (recordType !== "transfer" && !categoryID) {
      setErrorMessage("Category is required.");
      return;
    }
    if (recordType === "transfer" && !toWalletID) {
      setErrorMessage("Destination wallet is required.");
      return;
    }
    if (recordType === "transfer" && walletID === toWalletID) {
      setErrorMessage("Source and destination wallets must be different.");
      return;
    }
    if (slipUploading) {
      setErrorMessage("Slip upload is still in progress.");
      return;
    }

    const sourceWallet = wallets.find((item) => item.id === walletID);
    if ((recordType === "expense" || recordType === "transfer") && sourceWallet && amountValue > Number(sourceWallet.amount || 0)) {
      setErrorMessage("Insufficient wallet balance for this entry.");
      return;
    }

    setSubmitting(true);
    try {
      if (recordType === "transfer") {
        await authApi.createMyTransferTransaction({
          from_wallet_id: walletID,
          to_wallet_id: toWalletID,
          category_id: categoryID || undefined,
          amount: Number(amountValue.toFixed(2)),
          transaction_date: date,
          note: note.trim(),
        });
      } else {
        await authApi.createMyTransaction({
          wallet_id: walletID,
          category_id: categoryID,
          amount: Number(amountValue.toFixed(2)),
          type: recordType,
          transaction_date: date,
          note: note.trim(),
          image_url: uploadedSlipURL || undefined,
        });
      }

      await onSubmitted();
      setSuccessMessage("Entry archived successfully.");
      resetForm();
      setTimeout(() => {
        onBack();
      }, 900);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to create transaction.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.path}>Entry</Text>
              <Text style={styles.title}>New Transaction</Text>
            </View>
            <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}>
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.netWorthWrap}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                {totalNetWorthText}
              </Text>
            </View>
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
              <Text style={styles.backText}>Back to Dashboard</Text>
            </Pressable>
          </View>
        </View>

        <AppCard style={styles.formCard}>
          <Text style={styles.cardTitle}>Execute New Transaction</Text>

          <View style={styles.toggleWrap}>
            {(["expense", "income", "transfer"] as RecordType[]).map((type) => {
              const active = recordType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => {
                    setRecordType(type);
                    setCategoryID("");
                    if (type !== "transfer") {
                      setToWalletID("");
                    }
                  }}
                  style={({ pressed }) => [styles.toggleBtn, active && styles.toggleBtnActive, pressed && styles.toggleBtnPressed]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      active && styles.toggleTextActive,
                      type === "expense" && active && styles.toggleExpense,
                      type === "income" && active && styles.toggleIncome,
                      type === "transfer" && active && styles.toggleTransfer,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.form}>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Monetary Value</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>THB</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSubtle}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>
            </View>

            <View style={styles.formGrid}>
              <AppSelect
                label={recordType === "transfer" ? "From Wallet" : "Wallet"}
                placeholder="Select wallet"
                value={walletID}
                options={walletOptions}
                onChange={setWalletID}
              />

              <AppSelect
                label={recordType === "transfer" ? "Transfer Category" : "Category"}
                placeholder={recordType === "transfer" ? "Optional" : "Select category"}
                value={categoryID}
                options={categoryOptions}
                onChange={setCategoryID}
                disabled={categoryOptions.length === 0}
              />

              {recordType === "transfer" ? (
                <AppSelect
                  label="To Wallet"
                  placeholder="Select destination wallet"
                  value={toWalletID}
                  options={destinationWalletOptions}
                  onChange={setToWalletID}
                />
              ) : null}

              <View style={styles.dateFieldWrap}>
                <Text style={styles.dateLabel}>Transaction Date</Text>
                <Pressable
                  onPress={() => {
                    setDateDraft(date);
                    setDateModalVisible(true);
                  }}
                  style={({ pressed }) => [styles.dateTrigger, pressed && styles.dateTriggerPressed]}
                >
                  <Text style={styles.dateTriggerText}>{date || "Select date"}</Text>
                  <Text style={styles.dateTriggerIcon}>▼</Text>
                </Pressable>
              </View>

              <AppInput label="Identifier (Note)" value={note} onChangeText={setNote} placeholder="Brief description" />
            </View>

            <View style={styles.slipWrap}>
              <Text style={styles.slipLabel}>Slip Attachment (Optional)</Text>
              <Pressable
                onPress={() => setSlipSourceModalVisible(true)}
                disabled={slipUploading || !walletID}
                style={({ pressed }) => [styles.attachBtn, (!walletID || slipUploading) && styles.attachBtnDisabled, pressed && walletID && !slipUploading && styles.attachBtnPressed]}
              >
                <Text style={styles.attachText}>{slipUploading ? "Uploading slip..." : "Attach Slip Image"}</Text>
              </Pressable>
              {!walletID ? <Text style={styles.attachHint}>Select wallet first before uploading slip.</Text> : null}
              {slipPreviewURL ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: slipPreviewURL }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewFooter}>
                    <Text style={styles.previewName}>{slipFileName || "slip-image"}</Text>
                    <Pressable
                      onPress={() => {
                        setUploadedSlipURL("");
                        setSlipPreviewURL("");
                        setSlipFileName("");
                      }}
                    >
                      <Text style={styles.removeSlipText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <Pressable
              onPress={() => setSubmitConfirmVisible(true)}
              disabled={submitting}
              style={({ pressed }) => [styles.confirmBtn, (submitting || slipUploading) && styles.confirmBtnDisabled, pressed && !submitting && styles.confirmBtnPressed]}
            >
              <Text style={styles.confirmText}>{submitting ? "Saving..." : "Confirm Transaction"}</Text>
            </Pressable>
          </View>
        </AppCard>
      </ScrollView>

      {(submitting || slipUploading) ? (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.overlayCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.overlayText}>{submitting ? "Saving transaction..." : "Uploading slip..."}</Text>
          </View>
        </View>
      ) : null}

      <Modal transparent animationType="fade" visible={slipSourceModalVisible} onRequestClose={() => setSlipSourceModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Attach Slip</Text>
            <Pressable
              onPress={() => {
                setSlipSourceModalVisible(false);
                void pickSlipFromCamera();
              }}
              style={styles.sourceOptionBtn}
            >
              <Text style={styles.sourceOptionText}>Take Photo</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setSlipSourceModalVisible(false);
                void pickSlipFromLibrary();
              }}
              style={styles.sourceOptionBtn}
            >
              <Text style={styles.sourceOptionText}>Choose from Library</Text>
            </Pressable>
            <Pressable onPress={() => setSlipSourceModalVisible(false)} style={styles.modalGhostBtn}>
              <Text style={styles.modalGhostText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={submitConfirmVisible} onRequestClose={() => setSubmitConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Save</Text>
            <Text style={styles.confirmDescription}>
              {recordType === "transfer" ? "Transfer between wallets?" : "Save this transaction record?"}
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSubmitConfirmVisible(false)} style={styles.modalGhostBtn}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSubmitConfirmVisible(false);
                  void submitTransaction();
                }}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={dateModalVisible} onRequestClose={() => setDateModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Transaction Date</Text>
            <AppInput label="Date" value={dateDraft} onChangeText={setDateDraft} placeholder="YYYY-MM-DD" />
            <View style={styles.quickDateRow}>
              <Pressable onPress={() => setDateDraft(toDateOnly(new Date()))} style={styles.quickDateBtn}>
                <Text style={styles.quickDateText}>Today</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setDateDraft(toDateOnly(d));
                }}
                style={styles.quickDateBtn}
              >
                <Text style={styles.quickDateText}>Yesterday</Text>
              </Pressable>
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setDateModalVisible(false)} style={styles.modalGhostBtn}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDate(dateDraft);
                  setDateModalVisible(false);
                }}
                style={styles.modalPrimaryBtn}
              >
                <Text style={styles.modalPrimaryText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.lg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  path: {
    color: theme.colors.indigo,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_300Light",
    fontSize: 34,
    letterSpacing: -0.8,
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuBtnPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  menuBtnText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  netWorthWrap: {
    flex: 1,
    minWidth: 0,
  },
  netWorthLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  netWorthValue: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 25,
    letterSpacing: -0.4,
  },
  backBtn: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
  },
  backBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  backText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  formCard: {
    borderRadius: 44,
    paddingHorizontal: 26,
    paddingVertical: 30,
  },
  cardTitle: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 3.6,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  toggleWrap: {
    flexDirection: "row",
    backgroundColor: theme.colors.bgSoft,
    borderRadius: 32,
    padding: 6,
    marginBottom: theme.spacing.xl,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.white,
  },
  toggleBtnPressed: {
    opacity: 0.9,
  },
  toggleText: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  toggleTextActive: {
    color: theme.colors.textPrimary,
  },
  toggleExpense: {
    color: theme.colors.rose,
  },
  toggleIncome: {
    color: theme.colors.emerald,
  },
  toggleTransfer: {
    color: "#2563eb",
  },
  form: {
    gap: theme.spacing.lg,
  },
  amountBlock: {
    alignItems: "center",
    gap: theme.spacing.md,
  },
  amountLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  amountRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
  },
  currency: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 22,
    marginBottom: 9,
  },
  amountInput: {
    minWidth: 170,
    maxWidth: "76%",
    textAlign: "center",
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_300Light",
    fontSize: 52,
    letterSpacing: -1.5,
    paddingVertical: 0,
  },
  formGrid: {
    gap: theme.spacing.md,
  },
  dateFieldWrap: {
    gap: theme.spacing.sm,
  },
  dateLabel: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: theme.type.label,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  dateTrigger: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.68)",
    paddingHorizontal: theme.spacing.lg,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTriggerPressed: {
    opacity: 0.9,
  },
  dateTriggerText: {
    fontFamily: "Manrope_500Medium",
    color: theme.colors.textPrimary,
    fontSize: theme.type.body,
  },
  dateTriggerIcon: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  slipWrap: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.62)",
    padding: theme.spacing.md,
  },
  slipLabel: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.textMuted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: theme.type.label,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  attachBtn: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  attachBtnDisabled: {
    opacity: 0.55,
  },
  attachBtnPressed: {
    opacity: 0.88,
  },
  attachText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  attachHint: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },
  previewWrap: {
    gap: theme.spacing.sm,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgSoft,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  previewName: {
    flex: 1,
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
  },
  removeSlipText: {
    color: theme.colors.rose,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorText: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
  },
  successText: {
    color: theme.colors.emerald,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
  },
  confirmBtn: {
    minHeight: 62,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  confirmText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.26)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  overlayCard: {
    minWidth: 220,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  overlayText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  confirmDescription: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 19,
  },
  sourceOptionBtn: {
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceOptionText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  quickDateRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  quickDateBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quickDateText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  modalGhostBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGhostText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  modalPrimaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
