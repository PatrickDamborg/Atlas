"use client";

/**
 * Error state displayed when an invite link is invalid, expired,
 * revoked, or otherwise unusable.
 *
 * The NO_SEATS_AVAILABLE state receives special treatment: it shows a
 * prominent "hard block" card with the administrator's contact email
 * (if available) so end users know exactly whom to reach out to.
 */

import {
  Body1,
  Body2,
  Button,
  Card,
  Link,
  Title3,
  tokens,
  makeStyles,
  Divider,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  ArrowCounterclockwiseRegular,
  ClockRegular,
  DismissCircleRegular,
  DocumentBulletListClockRegular,
  ErrorCircleRegular,
  MailRegular,
  PeopleTeamRegular,
  ShieldLockRegular,
  WifiWarningRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "40px 20px",
  },
  card: {
    maxWidth: "480px",
    width: "100%",
    padding: "32px",
    textAlign: "center",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground1,
  },
  seatBlockIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: "56px",
    marginBottom: "20px",
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: "12px",
  },
  retryButton: {
    marginTop: "20px",
  },
  helpText: {
    color: tokens.colorNeutralForeground3,
    marginTop: "20px",
    fontSize: tokens.fontSizeBase200,
  },
  // ── Seat-limit hard-block styles ──────────────────────────────
  seatBlockCard: {
    maxWidth: "520px",
    width: "100%",
    padding: "40px 32px",
    textAlign: "center",
    borderTopWidth: "4px",
    borderTopStyle: "solid",
    borderTopColor: tokens.colorPaletteRedBorderActive,
  },
  seatBlockTitle: {
    marginBottom: "8px",
  },
  seatBlockMessage: {
    color: tokens.colorNeutralForeground2,
    marginTop: "16px",
    lineHeight: "1.6",
  },
  adminContactSection: {
    marginTop: "24px",
    paddingTop: "16px",
    paddingRight: "20px",
    paddingBottom: "16px",
    paddingLeft: "20px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  adminContactLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    letterSpacing: "0.5px",
    fontWeight: tokens.fontWeightSemibold,
  },
  adminContactEmail: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  mailButton: {
    marginTop: "4px",
  },
  divider: {
    marginTop: "24px",
    marginBottom: "16px",
  },
  projectLabel: {
    marginTop: "8px",
    fontStyle: "italic",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface InviteErrorStateProps {
  errorCode: string | null;
  errorMessage: string | null;
  projectName: string | null;
  /** Administrator contact email — shown prominently for seat-limit blocks. */
  adminContactEmail?: string | null;
}

export function InviteErrorState({
  errorCode,
  errorMessage,
  projectName,
  adminContactEmail,
}: InviteErrorStateProps) {
  const styles = useStyles();

  // ── Seat limit reached — dedicated hard-block UI ────────────────
  if (errorCode === "NO_SEATS_AVAILABLE") {
    const mailSubject = encodeURIComponent(
      `Seat limit reached${projectName ? ` — ${projectName}` : ""}`
    );
    const mailBody = encodeURIComponent(
      "Hello,\n\nI tried to access the training walkthrough but the seat limit has been reached. " +
        "Could you please increase the seat limit or free up an existing seat?\n\nThank you."
    );

    return (
      <div className={styles.container}>
        <Card className={styles.seatBlockCard}>
          <ShieldLockRegular className={styles.seatBlockIcon} aria-hidden />

          <Title3 as="h1" block className={styles.seatBlockTitle}>
            Seat Limit Reached
          </Title3>

          {projectName && (
            <Body1 className={styles.projectLabel}>
              Project: {projectName}
            </Body1>
          )}

          <Body1 className={styles.seatBlockMessage}>
            {errorMessage ??
              "All available seats for this project have been filled. No new users can join until the administrator increases the seat limit or frees up existing seats."}
          </Body1>

          {adminContactEmail ? (
            <div className={styles.adminContactSection}>
              <Body2 className={styles.adminContactLabel}>
                CONTACT ADMINISTRATOR
              </Body2>
              <Link
                className={styles.adminContactEmail}
                href={`mailto:${adminContactEmail}?subject=${mailSubject}&body=${mailBody}`}
              >
                <MailRegular style={{ marginRight: 6 }} />
                {adminContactEmail}
              </Link>
              <Button
                appearance="primary"
                className={styles.mailButton}
                icon={<MailRegular />}
                as="a"
                href={`mailto:${adminContactEmail}?subject=${mailSubject}&body=${mailBody}`}
              >
                Request Access
              </Button>
            </div>
          ) : (
            <MessageBar intent="warning" style={{ marginTop: 24, textAlign: "left" }}>
              <MessageBarBody>
                Please contact the person who shared this invite link with you
                to request additional seats.
              </MessageBarBody>
            </MessageBar>
          )}

          <Divider className={styles.divider} />

          <Body1 className={styles.helpText}>
            This is not an error with your invite link — the project simply has
            no more seats available. Your administrator can increase the limit
            or revoke unused seats to make room.
          </Body1>
        </Card>
      </div>
    );
  }

  // ── Generic error states ────────────────────────────────────────

  const getIcon = () => {
    switch (errorCode) {
      case "INVITE_EXPIRED":
        return <ClockRegular className={`${styles.icon} ${styles.warningIcon}`} />;
      case "INVITE_REVOKED":
        return <DismissCircleRegular className={`${styles.icon} ${styles.errorIcon}`} />;
      case "INVITE_EXHAUSTED":
        return <PeopleTeamRegular className={`${styles.icon} ${styles.warningIcon}`} />;
      case "TRAINING_NOT_READY":
        return <DocumentBulletListClockRegular className={`${styles.icon} ${styles.warningIcon}`} />;
      case "NETWORK_ERROR":
        return <WifiWarningRegular className={`${styles.icon} ${styles.errorIcon}`} />;
      case "INVALID_TOKEN_FORMAT":
        return <ErrorCircleRegular className={`${styles.icon} ${styles.errorIcon}`} />;
      default:
        return <ErrorCircleRegular className={`${styles.icon} ${styles.errorIcon}`} />;
    }
  };

  const getTitle = () => {
    switch (errorCode) {
      case "INVITE_EXPIRED":
        return "Invite Link Expired";
      case "INVITE_REVOKED":
        return "Invite Link Revoked";
      case "INVITE_EXHAUSTED":
        return "Invite Link Fully Used";
      case "INVITE_NOT_FOUND":
        return "Invalid Invite Link";
      case "TRAINING_NOT_READY":
        return "Training Not Available Yet";
      case "NETWORK_ERROR":
        return "Connection Error";
      case "INVALID_TOKEN_FORMAT":
        return "Invalid Invite Link";
      default:
        return "Unable to Access";
    }
  };

  // Retryable errors: network issues and training not ready
  const isRetryable =
    errorCode === "NETWORK_ERROR" || errorCode === "TRAINING_NOT_READY";

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {getIcon()}
        <Title3 as="h1" block>
          {getTitle()}
        </Title3>
        <Body1 className={styles.subtitle}>
          {errorMessage ?? "This invite link cannot be used. Please contact your administrator."}
        </Body1>
        {projectName && (
          <Body1
            className={styles.subtitle}
            style={{ marginTop: "8px", fontStyle: "italic" }}
          >
            Project: {projectName}
          </Body1>
        )}
        {isRetryable && (
          <Button
            appearance="primary"
            className={styles.retryButton}
            icon={<ArrowCounterclockwiseRegular />}
            onClick={handleRetry}
          >
            Try Again
          </Button>
        )}
        <Body1 className={styles.helpText}>
          If you continue to have issues, please contact the person who shared this link with you.
        </Body1>
      </Card>
    </div>
  );
}
