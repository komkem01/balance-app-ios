import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { authApi, type MeResponse } from "../api/auth";
import { AppCard } from "../components/AppCard";
import { AppScreen } from "../components/AppScreen";
import { theme } from "../theme";

type ProfileScreenProps = {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    username: string;
    phone: string;
    profileImageURL: string;
    lastLogin: string;
  };
  totalNetWorth: number;
  onOpenSidebar: () => void;
  onQuickEntry: () => void;
  onProfileUpdated: (nextMe: MeResponse) => void;
};

type PendingAction = "update-profile" | "change-password" | "remove-image" | "upload-image";

const formatCurrency = (value: number) => {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${value < 0 ? "-" : ""}THB ${abs}`;
};

export function ProfileScreen({ profile, totalNetWorth, onOpenSidebar, onQuickEntry, onProfileUpdated }: ProfileScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 820;
  const isSmallPhone = width < 420;

  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [phone, setPhone] = useState(profile.phone || "");

  const [profileImageURL, setProfileImageURL] = useState(profile.profileImageURL || "");
  const [profileImageFileName, setProfileImageFileName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [imageSourceVisible, setImageSourceVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirm Update");
  const [confirmDescription, setConfirmDescription] = useState("Proceed?");
  const [confirmLabel, setConfirmLabel] = useState("Confirm");
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingImageAsset, setPendingImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setDisplayName(profile.displayName || "");
    setPhone(profile.phone || "");
    setProfileImageURL(profile.profileImageURL || "");
  }, [profile]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [successMessage]);

  const source = (displayName || `${firstName} ${lastName}` || profile.username || "Member").trim();
  const profileInitials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item.slice(0, 1).toUpperCase())
    .join("") || "M";

  const busy = profileSaving || passwordSaving || imageUploading;

  const openConfirm = (config: {
    title: string;
    description: string;
    label: string;
    action: PendingAction;
    danger?: boolean;
  }) => {
    setConfirmTitle(config.title);
    setConfirmDescription(config.description);
    setConfirmLabel(config.label);
    setConfirmDanger(Boolean(config.danger));
    setPendingAction(config.action);
    setConfirmVisible(true);
  };

  const applyMe = (me: MeResponse) => {
    setFirstName(me.first_name || "");
    setLastName(me.last_name || "");
    setDisplayName(me.display_name || "");
    setPhone(me.phone || "");
    setProfileImageURL(me.profile_image_url || "");
    onProfileUpdated(me);
  };

  const prepareImageAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    const maxWidth = 1200;
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
      fileName: asset.fileName || `profile-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    };
  };

  const uploadProfileAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setErrorMessage("");
    setSuccessMessage("");
    setImageUploading(true);

    try {
      const prepared = await prepareImageAsset(asset);
      const me = await authApi.uploadMyProfileImage(prepared);
      applyMe(me);
      setProfileImageFileName(asset.fileName || "profile-image.jpg");
      setSuccessMessage("Profile image attached");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("member-profile-image-upload-failed");
      }
    } finally {
      setImageUploading(false);
    }
  };

  const validateProfileAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (typeof asset.fileSize === "number" && asset.fileSize > 10 * 1024 * 1024) {
      setErrorMessage("Profile image must be 10MB or less");
      return false;
    }

    if (asset.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) {
      setErrorMessage("Only JPG, PNG, and WEBP are supported");
      return false;
    }

    return true;
  };

  const confirmUploadAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (!validateProfileAsset(asset)) {
      return;
    }

    const hasCurrentImage = Boolean(profileImageURL);
    setPendingImageAsset(asset);
    openConfirm({
      title: hasCurrentImage ? "Confirm Replace Image" : "Confirm Upload Image",
      description: hasCurrentImage
        ? "This will replace your current profile image. Do you want to continue?"
        : "Do you want to upload this profile image?",
      label: hasCurrentImage ? "Replace" : "Upload",
      action: "upload-image",
    });
  };

  const pickFromLibrary = async () => {
    setErrorMessage("");
    setImageSourceVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Photo permission is required to choose profile image.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 220));

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.92,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      confirmUploadAsset(result.assets[0]);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "member-profile-image-upload-failed");
      } else {
        setErrorMessage("member-profile-image-upload-failed");
      }
    }
  };

  const pickFromCamera = async () => {
    setErrorMessage("");
    setImageSourceVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Camera permission is required to capture profile image.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 220));

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.92,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      confirmUploadAsset(result.assets[0]);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "member-profile-image-upload-failed");
      } else {
        setErrorMessage("member-profile-image-upload-failed");
      }
    }
  };

  const saveProfile = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!profile.id) {
      setErrorMessage("member-me-failed");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !displayName.trim()) {
      setErrorMessage("First name, last name, and display name are required.");
      return;
    }

    setProfileSaving(true);
    try {
      const me = await authApi.updateMe(profile.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim(),
        phone: phone.trim(),
      });
      applyMe(me);
      setSuccessMessage("Profile Updated Successfully");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("member-update-failed");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("member-password-required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("member-password-confirmation-mismatch");
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password Changed Successfully");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("member-password-change-failed");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const removeImage = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!profile.id) {
      setErrorMessage("member-me-failed");
      return;
    }

    setImageUploading(true);
    try {
      const me = await authApi.updateMe(profile.id, {
        profile_image_url: "",
      });
      applyMe(me);
      setProfileImageFileName("");
      setSuccessMessage("Profile image removed");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("member-profile-image-remove-failed");
      }
    } finally {
      setImageUploading(false);
    }
  };

  const executeConfirmAction = async () => {
    const action = pendingAction;
    setConfirmVisible(false);
    setPendingAction(null);

    if (!action) {
      return;
    }

    if (action === "update-profile") {
      await saveProfile();
      return;
    }

    if (action === "change-password") {
      await savePassword();
      return;
    }

    if (action === "upload-image") {
      const asset = pendingImageAsset;
      setPendingImageAsset(null);
      if (!asset) {
        return;
      }
      await uploadProfileAsset(asset);
      return;
    }

    await removeImage();
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.path}>Profile</Text>
              <Text style={styles.title}>User Identity</Text>
            </View>
            <Pressable onPress={onOpenSidebar} style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}>
              <Text style={styles.menuBtnText}>Menu</Text>
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.netWorthWrap}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                {formatCurrency(totalNetWorth)}
              </Text>
            </View>
            <Pressable onPress={onQuickEntry} style={({ pressed }) => [styles.quickEntryBtn, pressed && styles.quickEntryBtnPressed]}>
              <Text style={styles.quickEntryText}>Quick Entry</Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <AppCard>
          <View style={[styles.imageSection, isSmallPhone && styles.imageSectionCompact]}>
            <View style={[styles.imageSectionLeft, isSmallPhone && styles.imageSectionLeftCompact]}>
              {profileImageURL ? (
                <Image source={{ uri: profileImageURL }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{profileInitials}</Text>
                </View>
              )}
              <View style={styles.imageMeta}>
                <Text style={styles.imageLabel}>Profile Image</Text>
                <Text style={styles.imageHint}>JPG, PNG, WEBP (max 10MB)</Text>
                {profileImageFileName ? (
                  <Text style={styles.imageFileName} numberOfLines={1} ellipsizeMode="tail">
                    {profileImageFileName}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.imageActionWrap, isSmallPhone && styles.imageActionWrapCompact]}>
              <Pressable onPress={() => setImageSourceVisible(true)} style={({ pressed }) => [styles.imageActionBtn, pressed && styles.imageActionPressed]}>
                <Text style={styles.imageActionText}>Choose Image</Text>
              </Pressable>
              {profileImageURL ? (
                <Pressable
                  onPress={() => {
                    openConfirm({
                      title: "Confirm Remove Image",
                      description: "Do you want to remove your current profile image?",
                      label: "Remove",
                      action: "remove-image",
                      danger: true,
                    });
                  }}
                  style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={[styles.fieldsWrap, isCompact && styles.fieldsWrapCompact]}>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={theme.colors.textSubtle}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={theme.colors.textSubtle}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                placeholder="Display name"
                placeholderTextColor={theme.colors.textSubtle}
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={theme.colors.textSubtle}
              />
            </View>
          </View>

          <View style={styles.metaRows}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Username</Text>
              <Text style={styles.metaValue}>{profile.username || "-"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Last Login</Text>
              <Text style={styles.metaValue}>{profile.lastLogin || "-"}</Text>
            </View>
          </View>

          <View style={styles.updateWrap}>
            <Pressable
              onPress={() => {
                openConfirm({
                  title: "Confirm Update",
                  description: "Save profile changes?",
                  label: "Update",
                  action: "update-profile",
                });
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            >
              <Text style={styles.primaryBtnText}>Update Profile</Text>
            </Pressable>
          </View>
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Security Credentials</Text>

          <View style={[styles.fieldsWrap, isCompact && styles.fieldsWrapCompact]}>
            <View style={[styles.fieldItem, styles.fieldFull]}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
                placeholder="........"
                placeholderTextColor={theme.colors.textSubtle}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                placeholder="........"
                placeholderTextColor={theme.colors.textSubtle}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldItem}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholder="........"
                placeholderTextColor={theme.colors.textSubtle}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.updateWrap}>
            <Pressable
              onPress={() => {
                openConfirm({
                  title: "Confirm Update",
                  description: "Change account password?",
                  label: "Update",
                  action: "change-password",
                });
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            >
              <Text style={styles.primaryBtnText}>Change Password</Text>
            </Pressable>
          </View>
        </AppCard>
      </ScrollView>

      <Modal visible={imageSourceVisible} transparent animationType="fade" onRequestClose={() => setImageSourceVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            <Text style={styles.modalDescription}>Pick where to select your profile image.</Text>
            <View style={styles.modalActionsStack}>
              <Pressable onPress={pickFromCamera} style={({ pressed }) => [styles.modalPrimaryBtnBlock, pressed && styles.primaryBtnPressed]}>
                <Text style={styles.modalPrimaryText}>Use Camera</Text>
              </Pressable>
              <Pressable onPress={pickFromLibrary} style={({ pressed }) => [styles.modalGhostBtnBlock, pressed && styles.modalGhostBtnPressed]}>
                <Text style={styles.modalGhostText}>Choose From Library</Text>
              </Pressable>
              <Pressable onPress={() => setImageSourceVisible(false)} style={({ pressed }) => [styles.modalGhostBtnBlock, pressed && styles.modalGhostBtnPressed]}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirmTitle}</Text>
            <Text style={styles.modalDescription}>{confirmDescription}</Text>
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => {
                  setConfirmVisible(false);
                  setPendingAction(null);
                  setPendingImageAsset(null);
                }}
                style={({ pressed }) => [styles.modalGhostBtnRow, pressed && styles.modalGhostBtnPressed]}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void executeConfirmAction();
                }}
                style={({ pressed }) => [confirmDanger ? styles.modalDangerBtnRow : styles.modalPrimaryBtnRow, pressed && styles.primaryBtnPressed]}
              >
                <Text style={styles.modalPrimaryText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={busy} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Processing request...</Text>
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
    gap: theme.spacing.md,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
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
    alignSelf: "flex-start",
    minHeight: 36,
    minWidth: 74,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
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
  quickEntryBtn: {
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.button,
  },
  quickEntryBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  quickEntryText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  imageSection: {
    backgroundColor: theme.colors.bgSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  imageSectionCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  imageSectionLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  imageSectionLeftCompact: {
    width: "100%",
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 22,
    letterSpacing: 0.8,
  },
  imageMeta: {
    flex: 1,
    minWidth: 0,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
  },
  imageLabel: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  imageHint: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
  imageFileName: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
  imageActionWrap: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  imageActionWrapCompact: {
    width: "100%",
    alignItems: "stretch",
  },
  imageActionBtn: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  imageActionPressed: {
    transform: [{ scale: 0.98 }],
  },
  imageActionText: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  removeBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecdd3",
    backgroundColor: "#fff1f2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnPressed: {
    opacity: 0.84,
  },
  removeBtnText: {
    color: "#e11d48",
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  sectionTitle: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  fieldsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  fieldsWrapCompact: {
    marginHorizontal: 0,
  },
  fieldItem: {
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: theme.spacing.md,
  },
  fieldFull: {
    width: "100%",
  },
  input: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.bgSoft,
    minHeight: 54,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
  label: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  metaRows: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.bgSoft,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  metaLabel: {
    color: theme.colors.textSubtle,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  metaValue: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  updateWrap: {
    marginTop: theme.spacing.sm,
    maxWidth: 220,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    ...theme.shadows.button,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  errorText: {
    color: theme.colors.rose,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  successText: {
    color: theme.colors.emerald,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    marginBottom: 10,
  },
  modalDescription: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalActionsStack: {
    gap: 10,
  },
  modalGhostBtnRow: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
  },
  modalGhostBtnBlock: {
    width: "100%",
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
  },
  modalGhostBtnPressed: {
    opacity: 0.84,
  },
  modalGhostText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    flexShrink: 1,
  },
  modalPrimaryBtnRow: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
  },
  modalPrimaryBtnBlock: {
    width: "100%",
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
  },
  modalDangerBtnRow: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e11d48",
    paddingHorizontal: 12,
  },
  modalPrimaryText: {
    color: theme.colors.white,
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    flexShrink: 1,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingCard: {
    minWidth: 190,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    backgroundColor: theme.colors.white,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
  },
});
