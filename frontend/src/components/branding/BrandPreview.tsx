"use client";

import { makeStyles, Text, tokens } from "@fluentui/react-components";
import {
  Home24Regular,
  People24Regular,
  Settings24Regular,
  ChevronRight12Regular,
  Add20Regular,
  Delete20Regular,
  Save20Regular,
  ArrowClockwise20Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "hidden",
    boxShadow: tokens.shadow4,
    minHeight: "420px",
    display: "flex",
    flexDirection: "column",
  },
  navBar: {
    display: "flex",
    alignItems: "center",
    height: "48px",
    paddingLeft: "16px",
    paddingRight: "16px",
    gap: "12px",
  },
  navTitle: {
    fontWeight: 600,
    fontSize: "14px",
    letterSpacing: "0.02em",
  },
  navSearch: {
    marginLeft: "auto",
    width: "200px",
    height: "28px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingLeft: "8px",
    fontSize: "12px",
    outline: "none",
  },
  bodyContainer: {
    display: "flex",
    flex: 1,
  },
  sitemap: {
    width: "220px",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: "8px",
    flexShrink: 0,
  },
  sitemapGroup: {
    paddingLeft: "12px",
    paddingRight: "12px",
    marginBottom: "4px",
  },
  sitemapGroupLabel: {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    paddingTop: "12px",
    paddingBottom: "4px",
    opacity: 0.6,
  },
  sitemapItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "default",
    fontSize: "13px",
  },
  sitemapItemActive: {
    fontWeight: 600,
  },
  commandBar: {
    display: "flex",
    alignItems: "center",
    height: "44px",
    paddingLeft: "16px",
    paddingRight: "16px",
    gap: "4px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  commandButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "13px",
    border: "none",
    cursor: "default",
    backgroundColor: "transparent",
  },
  commandSeparator: {
    width: "1px",
    height: "20px",
    backgroundColor: tokens.colorNeutralStroke2,
    marginLeft: "4px",
    marginRight: "4px",
  },
  formArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  formHeader: {
    padding: "16px 20px 0 20px",
  },
  formTitle: {
    fontSize: "20px",
    fontWeight: 600,
  },
  tabBar: {
    display: "flex",
    gap: "0px",
    paddingLeft: "20px",
    paddingTop: "12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tab: {
    padding: "8px 16px",
    fontSize: "13px",
    cursor: "default",
    borderBottom: "2px solid transparent",
    color: tokens.colorNeutralForeground2,
  },
  tabActive: {
    fontWeight: 600,
    borderBottom: "2px solid",
  },
  formContent: {
    padding: "20px",
    flex: 1,
  },
  formSection: {
    marginBottom: "16px",
  },
  formSectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "12px",
    paddingBottom: "4px",
  },
  formFieldRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "10px",
  },
  formField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  formLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  formInput: {
    height: "32px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "4px",
    backgroundColor: tokens.colorNeutralBackground1,
    paddingLeft: "8px",
    fontSize: "13px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#fff",
  },
  logoPlaceholder: {
    width: "28px",
    height: "28px",
    borderRadius: "4px",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
  },
});

interface BrandPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerTextColor: string;
  backgroundColor: string;
  logoUrl?: string | null;
  companyName?: string;
}

export function BrandPreview({
  primaryColor,
  secondaryColor,
  accentColor,
  headerTextColor,
  backgroundColor,
  logoUrl,
  companyName,
}: BrandPreviewProps) {
  const styles = useStyles();

  const displayName = companyName || "Contoso Ltd";

  return (
    <div className={styles.container}>
      {/* ── D365 Dark Nav Bar ──────────────────────────────── */}
      <div
        className={styles.navBar}
        style={{ backgroundColor: primaryColor, color: headerTextColor }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{
              height: 28,
              width: 28,
              objectFit: "contain",
              borderRadius: 4,
            }}
          />
        ) : (
          <div className={styles.logoPlaceholder}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className={styles.navTitle} style={{ color: headerTextColor }}>
          {displayName}
        </span>
        <input
          className={styles.navSearch}
          style={{ color: headerTextColor }}
          placeholder="Search..."
          readOnly
          tabIndex={-1}
        />
      </div>

      <div className={styles.bodyContainer}>
        {/* ── Left Sitemap ──────────────────────────────────── */}
        <div
          className={styles.sitemap}
          style={{ backgroundColor: backgroundColor }}
        >
          <div className={styles.sitemapGroup}>
            <div className={styles.sitemapGroupLabel}>Main</div>
            <div
              className={`${styles.sitemapItem} ${styles.sitemapItemActive}`}
              style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
            >
              <Home24Regular style={{ fontSize: 18 }} />
              <span>Dashboard</span>
            </div>
            <div className={styles.sitemapItem}>
              <People24Regular style={{ fontSize: 18 }} />
              <span>Contacts</span>
            </div>
          </div>
          <div className={styles.sitemapGroup}>
            <div className={styles.sitemapGroupLabel}>Settings</div>
            <div className={styles.sitemapItem}>
              <Settings24Regular style={{ fontSize: 18 }} />
              <span>Administration</span>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ─────────────────────────────── */}
        <div className={styles.formArea}>
          {/* Command Bar */}
          <div className={styles.commandBar}>
            <div
              className={styles.commandButton}
              style={{ color: primaryColor }}
            >
              <Save20Regular />
              <span>Save</span>
            </div>
            <div
              className={styles.commandButton}
              style={{ color: primaryColor }}
            >
              <Add20Regular />
              <span>New</span>
            </div>
            <div className={styles.commandSeparator} />
            <div className={styles.commandButton}>
              <Delete20Regular />
              <span>Delete</span>
            </div>
            <div className={styles.commandButton}>
              <ArrowClockwise20Regular />
              <span>Refresh</span>
            </div>
          </div>

          {/* Form Header */}
          <div className={styles.formHeader}>
            <div className={styles.formTitle}>
              New Account
              <span
                className={styles.badge}
                style={{
                  backgroundColor: accentColor,
                  marginLeft: 12,
                  verticalAlign: "middle",
                }}
              >
                Active
              </span>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <div
              className={`${styles.tab} ${styles.tabActive}`}
              style={{ borderBottomColor: secondaryColor, color: secondaryColor }}
            >
              Summary
            </div>
            <div className={styles.tab}>Details</div>
            <div className={styles.tab}>Related</div>
          </div>

          {/* Form Content */}
          <div
            className={styles.formContent}
            style={{ backgroundColor: backgroundColor }}
          >
            <div className={styles.formSection}>
              <div
                className={styles.formSectionTitle}
                style={{ borderBottom: `1px solid ${secondaryColor}40` }}
              >
                Account Information
              </div>
              <div className={styles.formFieldRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Account Name *</label>
                  <div className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Phone</label>
                  <div className={styles.formInput} />
                </div>
              </div>
              <div className={styles.formFieldRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email</label>
                  <div className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Status Reason
                    <ChevronRight12Regular
                      style={{ marginLeft: 4, opacity: 0.5 }}
                    />
                  </label>
                  <div
                    className={styles.formInput}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      color: accentColor,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Active
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <div
                className={styles.formSectionTitle}
                style={{ borderBottom: `1px solid ${secondaryColor}40` }}
              >
                Address
              </div>
              <div className={styles.formFieldRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Street 1</label>
                  <div className={styles.formInput} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>City</label>
                  <div className={styles.formInput} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
