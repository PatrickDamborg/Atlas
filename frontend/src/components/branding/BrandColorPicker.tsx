"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Label,
  Spinner,
  MessageBar,
  MessageBarBody,
  Divider,
  makeStyles,
  tokens,
  Tooltip,
} from "@fluentui/react-components";
import {
  Color24Regular,
  Save24Regular,
  ArrowReset24Regular,
  Checkmark24Regular,
  Info16Regular,
  PaintBrush24Regular,
  Image24Regular,
} from "@fluentui/react-icons";
import type { BrandSettings, BrandSettingsUpdate } from "@/types/brand";
import { getBrandSettings, updateBrandSettings } from "@/lib/api";
import { BrandPreview } from "./BrandPreview";
import { LogoUpload } from "./LogoUpload";
import { useLogoUpload } from "@/hooks/useLogoUpload";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
    padding: tokens.spacingVerticalL,
    maxWidth: "1400px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  mainLayout: {
    display: "flex",
    gap: tokens.spacingHorizontalXXL,
    alignItems: "flex-start",
  },
  settingsPanel: {
    width: "380px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  previewPanel: {
    flex: 1,
    minWidth: "600px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  colorCard: {
    padding: tokens.spacingVerticalM,
  },
  colorSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  colorRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: tokens.spacingHorizontalM,
  },
  colorInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    flex: 1,
  },
  colorLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  nativeColorInput: {
    width: "44px",
    height: "44px",
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    padding: "2px",
    backgroundColor: "transparent",
    flexShrink: 0,
  },
  swatchPreview: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
  },
  swatch: {
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  presetRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap" as const,
    marginTop: tokens.spacingVerticalXS,
  },
  presetButton: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    padding: "4px 10px",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: "pointer",
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground1,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  presetSwatch: {
    width: "14px",
    height: "14px",
    borderRadius: "3px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS,
  },
  previewLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  savedBanner: {
    marginTop: tokens.spacingVerticalS,
  },
  logoCard: {
    padding: tokens.spacingVerticalM,
  },
  logoSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
  },
});

/** Preset brand palettes for quick selection. */
const PRESETS = [
  {
    name: "D365 Default",
    primary: "#0078D4",
    secondary: "#106EBE",
    accent: "#005A9E",
    headerText: "#FFFFFF",
    background: "#F3F2F1",
  },
  {
    name: "Teal Professional",
    primary: "#0E7C6B",
    secondary: "#0B5E52",
    accent: "#F2994A",
    headerText: "#FFFFFF",
    background: "#F5F5F5",
  },
  {
    name: "Purple Modern",
    primary: "#5B2D8E",
    secondary: "#7B3FA0",
    accent: "#FFB900",
    headerText: "#FFFFFF",
    background: "#FAF9F8",
  },
  {
    name: "Dark Navy",
    primary: "#1B2A4A",
    secondary: "#2E4374",
    accent: "#E74C3C",
    headerText: "#FFFFFF",
    background: "#F3F2F1",
  },
  {
    name: "Warm Red",
    primary: "#C4314B",
    secondary: "#A02639",
    accent: "#FFB900",
    headerText: "#FFFFFF",
    background: "#FFF8F6",
  },
];

interface BrandColorPickerProps {
  projectId: string;
}

export function BrandColorPicker({ projectId }: BrandColorPickerProps) {
  const styles = useStyles();

  // ── State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Color state
  const [primaryColor, setPrimaryColor] = useState("#0078D4");
  const [secondaryColor, setSecondaryColor] = useState("#106EBE");
  const [accentColor, setAccentColor] = useState("#005A9E");
  const [headerTextColor, setHeaderTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#F3F2F1");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Logo upload hook
  const {
    logoUrl: hookLogoUrl,
    isLoading: logoLoading,
    handleUpload: logoHandleUpload,
    handleDelete: logoHandleDelete,
  } = useLogoUpload({ projectId });

  // Track if changes have been made
  const [originalSettings, setOriginalSettings] = useState<BrandSettings | null>(
    null
  );

  const hasChanges =
    originalSettings !== null &&
    (primaryColor !== (originalSettings.primary_color || "#0078D4") ||
      secondaryColor !== (originalSettings.secondary_color || "#106EBE") ||
      accentColor !== (originalSettings.accent_color || "#005A9E") ||
      headerTextColor !== (originalSettings.header_text_color || "#FFFFFF") ||
      backgroundColor !== (originalSettings.background_color || "#F3F2F1"));

  // ── Sync logo URL from hook ──────────────────────────────────────────
  useEffect(() => {
    setLogoUrl(hookLogoUrl);
  }, [hookLogoUrl]);

  // ── Load settings ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const settings = await getBrandSettings(projectId);
        if (cancelled) return;

        setPrimaryColor(settings.primary_color || "#0078D4");
        setSecondaryColor(settings.secondary_color || "#106EBE");
        setAccentColor(settings.accent_color || "#005A9E");
        setHeaderTextColor(settings.header_text_color || "#FFFFFF");
        setBackgroundColor(settings.background_color || "#F3F2F1");
        setLogoUrl(settings.logo_url || null);
        setOriginalSettings(settings);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load brand settings"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── Save settings ────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);
    setSaved(false);

    try {
      const update: BrandSettingsUpdate = {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        header_text_color: headerTextColor,
        background_color: backgroundColor,
      };

      const result = await updateBrandSettings(projectId, update);
      setOriginalSettings(result);
      setSaved(true);

      // Clear saved banner after 3 seconds
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save brand settings"
      );
    } finally {
      setSaving(false);
    }
  }, [
    projectId,
    primaryColor,
    secondaryColor,
    accentColor,
    headerTextColor,
    backgroundColor,
  ]);

  // ── Reset to defaults ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPrimaryColor("#0078D4");
    setSecondaryColor("#106EBE");
    setAccentColor("#005A9E");
    setHeaderTextColor("#FFFFFF");
    setBackgroundColor("#F3F2F1");
  }, []);

  // ── Apply preset ─────────────────────────────────────────────────────
  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setPrimaryColor(preset.primary);
      setSecondaryColor(preset.secondary);
      setAccentColor(preset.accent);
      setHeaderTextColor(preset.headerText);
      setBackgroundColor(preset.background);
    },
    []
  );

  // ── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
        <Spinner label="Loading brand settings..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text size={700} weight="bold">
            <PaintBrush24Regular
              style={{ verticalAlign: "middle", marginRight: 8 }}
            />
            Brand Settings
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            Upload your logo and customize colors to match your client&apos;s
            brand identity. Changes are reflected in the live preview.
          </Text>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {saved && (
        <MessageBar intent="success" className={styles.savedBanner}>
          <MessageBarBody>
            <Checkmark24Regular
              style={{ verticalAlign: "middle", marginRight: 4 }}
            />
            Brand settings saved successfully!
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.mainLayout}>
        {/* ── Left: Color Settings Panel ─────────────────── */}
        <div className={styles.settingsPanel}>
          {/* Color Pickers */}
          <Card className={styles.colorCard}>
            <CardHeader
              image={<Color24Regular />}
              header={
                <Text weight="semibold" size={400}>
                  Color Palette
                </Text>
              }
            />
            <div className={styles.colorSection}>
              <ColorPickerField
                label="Primary Color"
                tooltip="Used for the navigation bar, primary buttons, and links"
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorPickerField
                label="Secondary Color"
                tooltip="Used for active tabs, hover states, and section accents"
                value={secondaryColor}
                onChange={setSecondaryColor}
              />
              <ColorPickerField
                label="Accent Color"
                tooltip="Used for badges, highlights, and call-to-action elements"
                value={accentColor}
                onChange={setAccentColor}
              />

              <Divider style={{ margin: "4px 0" }} />

              <ColorPickerField
                label="Header Text Color"
                tooltip="Text and icon color in the navigation bar"
                value={headerTextColor}
                onChange={setHeaderTextColor}
              />
              <ColorPickerField
                label="Background Color"
                tooltip="Page background color for form areas and content"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />

              {/* Color swatches summary */}
              <div className={styles.swatchPreview}>
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: primaryColor }}
                  title="Primary"
                />
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: secondaryColor }}
                  title="Secondary"
                />
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: accentColor }}
                  title="Accent"
                />
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: headerTextColor }}
                  title="Header Text"
                />
                <div
                  className={styles.swatch}
                  style={{ backgroundColor: backgroundColor }}
                  title="Background"
                />
              </div>
            </div>
          </Card>

          {/* Logo Upload */}
          <Card className={styles.logoCard}>
            <CardHeader
              image={<Image24Regular />}
              header={
                <Text weight="semibold" size={400}>
                  Logo
                </Text>
              }
            />
            <div className={styles.logoSection}>
              <LogoUpload
                currentLogoUrl={logoUrl}
                onUploadComplete={(url) => setLogoUrl(url)}
                onDelete={() => setLogoUrl(null)}
                disabled={saving}
                loading={logoLoading}
                onUpload={logoHandleUpload}
                onDeleteRequest={logoHandleDelete}
              />
            </div>
          </Card>

          {/* Presets */}
          <Card className={styles.colorCard}>
            <CardHeader
              header={
                <Text weight="semibold" size={400}>
                  Quick Presets
                </Text>
              }
            />
            <div className={styles.presetRow}>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  className={styles.presetButton}
                  onClick={() => applyPreset(preset)}
                  type="button"
                >
                  <div
                    className={styles.presetSwatch}
                    style={{ backgroundColor: preset.primary }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save Brand"}
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowReset24Regular />}
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* ── Right: Live Preview ────────────────────────── */}
        <div className={styles.previewPanel}>
          <div className={styles.previewLabel}>
            <Text weight="semibold" size={400}>
              Live Preview
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              — How your training walkthrough will appear to end users
            </Text>
          </div>
          <BrandPreview
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            headerTextColor={headerTextColor}
            backgroundColor={backgroundColor}
            logoUrl={logoUrl}
          />
        </div>
      </div>
    </div>
  );
}

// ── Color Picker Field ──────────────────────────────────────────────────

const useFieldStyles = makeStyles({
  colorRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: tokens.spacingHorizontalS,
  },
  colorInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  colorLabelRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  nativeColorInput: {
    width: "40px",
    height: "36px",
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    padding: "2px",
    backgroundColor: "transparent",
    flexShrink: 0,
  },
});

interface ColorPickerFieldProps {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPickerField({
  label,
  tooltip,
  value,
  onChange,
}: ColorPickerFieldProps) {
  const fieldStyles = useFieldStyles();

  return (
    <div className={fieldStyles.colorRow}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className={fieldStyles.nativeColorInput}
        title={`Pick ${label.toLowerCase()}`}
      />
      <div className={fieldStyles.colorInputGroup}>
        <div className={fieldStyles.colorLabelRow}>
          <Label size="small" weight="semibold">
            {label}
          </Label>
          <Tooltip content={tooltip} relationship="description">
            <Info16Regular
              style={{
                color: tokens.colorNeutralForeground3,
                cursor: "help",
              }}
            />
          </Tooltip>
        </div>
        <Input
          size="small"
          value={value}
          onChange={(_, data) => {
            const v = data.value.toUpperCase();
            if (/^#[0-9A-F]{0,6}$/.test(v) || v === "") {
              onChange(v);
            }
          }}
          onBlur={() => {
            // Ensure valid hex on blur — fall back to black
            if (!/^#[0-9A-F]{6}$/i.test(value)) {
              onChange("#000000");
            }
          }}
          style={{ fontFamily: "monospace" }}
          maxLength={7}
        />
      </div>
    </div>
  );
}
