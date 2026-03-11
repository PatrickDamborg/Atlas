"use client";

import {
  Text,
  Tooltip,
  makeStyles,
  shorthands,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Settings24Regular,
  QuestionCircle24Regular,
  Person24Regular,
  GridDots24Regular,
} from "@fluentui/react-icons";

// ── Styles ─────────────────────────────────────────────────────────────

const HEADER_HEIGHT = 48;

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    height: `${HEADER_HEIGHT}px`,
    minHeight: `${HEADER_HEIGHT}px`,
    backgroundColor: "#002050",
    color: "#ffffff",
    ...shorthands.padding("0", "12px"),
    boxSizing: "border-box",
    zIndex: 1000,
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  waffleBtnContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    cursor: "default",
    opacity: 0.85,
  },
  appName: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  environmentLabel: {
    fontSize: "11px",
    opacity: 0.7,
    marginLeft: "8px",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  centerSection: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ...shorthands.padding("0", "16px"),
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: "4px",
    ...shorthands.padding("4px", "12px"),
    gap: "8px",
    width: "360px",
    maxWidth: "100%",
    cursor: "default",
    userSelect: "none",
  },
  searchIcon: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: "16px",
    width: "16px",
    height: "16px",
    flexShrink: 0,
  },
  searchPlaceholder: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "13px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
    flexShrink: 0,
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "4px",
    cursor: "default",
    color: "rgba(255, 255, 255, 0.85)",
    backgroundColor: "transparent",
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
    },
  },
  userAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#4a90d9",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "default",
    userSelect: "none",
    marginLeft: "4px",
  },
});

// ── Component ──────────────────────────────────────────────────────────

interface D365NavBarProps {
  /** The app display name shown in the header. */
  appName: string;
  /** Optional environment label (e.g., "Production", "Sandbox"). */
  environmentLabel?: string;
  /** Brand primary color for the nav bar background (defaults to D365 dark blue). */
  primaryColor?: string;
  /** Brand text/icon color in the nav bar (defaults to white). */
  headerTextColor?: string;
  /** Optional logo URL shown before the app name. */
  logoUrl?: string | null;
}

/**
 * D365 dark navigation bar header.
 *
 * Replicates the Dynamics 365 model-driven app header with the waffle
 * menu icon, app name, global search placeholder, and header actions
 * (settings, help, user avatar). All interactive elements are
 * placeholder-only — they do not navigate or open dialogs.
 */
export function D365NavBar({
  appName,
  environmentLabel,
  primaryColor,
  headerTextColor,
  logoUrl,
}: D365NavBarProps) {
  const styles = useStyles();

  // Apply brand colours as inline overrides when provided
  const bgColor = primaryColor || "#002050";
  const textColor = headerTextColor || "#ffffff";

  return (
    <header
      className={styles.header}
      data-element-id="d365-navbar"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Left: logo/waffle + app name */}
      <div className={styles.leftSection}>
        <div className={styles.waffleBtnContainer}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width: 28,
                height: 28,
                objectFit: "contain",
                borderRadius: 4,
              }}
            />
          ) : (
            <GridDots24Regular />
          )}
        </div>
        <div className={styles.appName}>
          <Text
            size={400}
            weight="semibold"
            style={{ color: textColor, lineHeight: 1 }}
          >
            Dynamics 365
          </Text>
          <Text
            size={300}
            style={{ color: textColor, opacity: 0.85, lineHeight: 1 }}
          >
            &nbsp;| {appName}
          </Text>
        </div>
        {environmentLabel && (
          <span className={styles.environmentLabel}>{environmentLabel}</span>
        )}
      </div>

      {/* Center: search box placeholder */}
      <div className={styles.centerSection}>
        <Tooltip content="Search (placeholder)" relationship="description">
          <div className={styles.searchBox}>
            <Search24Regular className={styles.searchIcon} />
            <span className={styles.searchPlaceholder}>
              Search this app...
            </span>
          </div>
        </Tooltip>
      </div>

      {/* Right: action icons */}
      <div className={styles.rightSection}>
        <Tooltip content="Settings" relationship="label">
          <div className={styles.iconBtn} data-element-id="d365-settings-btn">
            <Settings24Regular style={{ fontSize: "18px", width: "18px", height: "18px" }} />
          </div>
        </Tooltip>
        <Tooltip content="Help" relationship="label">
          <div className={styles.iconBtn} data-element-id="d365-help-btn">
            <QuestionCircle24Regular style={{ fontSize: "18px", width: "18px", height: "18px" }} />
          </div>
        </Tooltip>
        <div className={styles.userAvatar} data-element-id="d365-user-avatar">
          U
        </div>
      </div>
    </header>
  );
}

export { HEADER_HEIGHT };
