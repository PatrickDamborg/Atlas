"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  Button,
  Card,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  makeStyles,
  tokens,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Shield20Regular,
  DocumentText20Regular,
  Cookies20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  Info20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import {
  getConsentContent,
  getConsentStatus,
  acceptConsent,
  ApiError,
} from "@/lib/api";
import type { ConsentContent, ConsentStatus } from "@/types/consent";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    paddingTop: tokens.spacingVerticalXXXL,
    paddingBottom: tokens.spacingVerticalXXXL,
  },
  content: {
    width: "720px",
    maxWidth: "100%",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  headerSection: {
    textAlign: "center",
    marginBottom: tokens.spacingVerticalXL,
  },
  headerIcon: {
    display: "flex",
    justifyContent: "center",
    marginBottom: tokens.spacingVerticalM,
  },
  iconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  lastUpdated: {
    color: tokens.colorNeutralForeground4,
    marginTop: tokens.spacingVerticalXS,
  },
  policyCard: {
    marginBottom: tokens.spacingVerticalL,
  },
  cardHeaderIcon: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  scrollableContent: {
    maxHeight: "320px",
    overflowY: "auto",
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingTop: tokens.spacingVerticalM,
  },
  // Markdown prose styles
  markdown: {
    "& h2": {
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalL,
      marginBottom: tokens.spacingVerticalS,
      color: tokens.colorNeutralForeground1,
    },
    "& h3": {
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalM,
      marginBottom: tokens.spacingVerticalXS,
      color: tokens.colorNeutralForeground1,
    },
    "& p": {
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase300,
      color: tokens.colorNeutralForeground2,
      marginTop: tokens.spacingVerticalXS,
      marginBottom: tokens.spacingVerticalS,
    },
    "& ul": {
      paddingLeft: tokens.spacingHorizontalXL,
      marginTop: tokens.spacingVerticalXS,
      marginBottom: tokens.spacingVerticalS,
    },
    "& li": {
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase400,
      color: tokens.colorNeutralForeground2,
      marginBottom: tokens.spacingVerticalXXS,
    },
    "& strong": {
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
    },
  },
  consentSection: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalL,
  },
  consentCard: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  consentCardContent: {
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
  },
  checkboxWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalM,
  },
  actionButtons: {
    display: "flex",
    width: "100%",
    maxWidth: "400px",
    gap: tokens.spacingHorizontalM,
  },
  acceptButton: {
    flexGrow: 1,
  },
  declineButton: {
    flexShrink: 0,
  },
  declineNote: {
    color: tokens.colorNeutralForeground4,
    textAlign: "center",
  },
  spinnerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    gap: tokens.spacingVerticalM,
  },
  errorContainer: {
    marginBottom: tokens.spacingVerticalL,
  },
  reconsentBanner: {
    marginBottom: tokens.spacingVerticalL,
  },
  successContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: tokens.spacingVerticalL,
    textAlign: "center",
  },
  successIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: tokens.colorStatusSuccessBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  declinedContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: tokens.spacingVerticalL,
    textAlign: "center",
  },
  declinedIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: tokens.colorStatusWarningBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  versionBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    backgroundColor: tokens.colorNeutralBackground4,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: "2px",
    paddingBottom: "2px",
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  declineDialogWarning: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorStatusWarningBackground1,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  declineDialogList: {
    marginTop: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalXL,
    "& li": {
      marginBottom: tokens.spacingVerticalXS,
    },
  },
});

// ── Props ─────────────────────────────────────────────────────────────

interface ConsentPromptScreenProps {
  /** The seat assignment ID (from invite redemption). */
  seatId: string;
  /** Called after consent is successfully accepted. */
  onConsentAccepted: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

export function ConsentPromptScreen({
  seatId,
  onConsentAccepted,
}: ConsentPromptScreenProps) {
  const styles = useStyles();

  // State
  const [consentContent, setConsentContent] = useState<ConsentContent | null>(
    null
  );
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  // Checkbox state
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);

  const allAccepted =
    privacyAccepted && termsAccepted && cookiesAccepted && dataProcessingAccepted;

  // ── Load consent content and status ────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadConsentData() {
      try {
        const [content, status] = await Promise.all([
          getConsentContent(),
          getConsentStatus(seatId),
        ]);

        if (cancelled) return;

        setConsentContent(content);
        setConsentStatus(status);

        // If user already has valid consent, skip the screen
        if (status.has_valid_consent) {
          onConsentAccepted();
          return;
        }

        setError(null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Failed to load consent information. Please try again.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConsentData();

    return () => {
      cancelled = true;
    };
  }, [seatId, onConsentAccepted]);

  // ── Handle consent acceptance ──────────────────────────────────────

  const handleAccept = useCallback(async () => {
    if (!consentContent || !allAccepted) return;

    setSubmitting(true);
    setError(null);

    try {
      await acceptConsent(seatId, {
        consent_accepted: true,
        policy_version: consentContent.policy_version,
      });

      setSuccess(true);

      // Brief delay so the user sees the success state
      setTimeout(() => {
        onConsentAccepted();
      }, 1500);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to record your consent. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [seatId, consentContent, allAccepted, onConsentAccepted]);

  // ── Handle explicit decline ────────────────────────────────────────

  const handleDeclineConfirm = useCallback(() => {
    setDeclineDialogOpen(false);
    setDeclined(true);
  }, []);

  // ── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.spinnerContainer}>
          <Spinner size="large" />
          <Text size={400} style={{ color: tokens.colorNeutralForeground3 }}>
            Loading privacy and consent information...
          </Text>
        </div>
      </div>
    );
  }

  // ── Success State ──────────────────────────────────────────────────

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <CheckmarkCircle20Regular
                style={{ fontSize: 32, color: tokens.colorStatusSuccessForeground1 }}
              />
            </div>
            <Text size={600} weight="semibold">
              Consent Recorded
            </Text>
            <Text
              size={400}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              Thank you. Redirecting you to your training materials...
            </Text>
            <Spinner size="small" />
          </div>
        </div>
      </div>
    );
  }

  // ── Declined State ─────────────────────────────────────────────────

  if (declined) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.declinedContainer}>
            <div className={styles.declinedIcon}>
              <DismissCircle20Regular
                style={{ fontSize: 32, color: tokens.colorStatusWarningForeground1 }}
              />
            </div>
            <Text size={600} weight="semibold">
              Consent Declined
            </Text>
            <Text
              size={400}
              style={{ color: tokens.colorNeutralForeground3, maxWidth: 480 }}
            >
              You have declined the privacy policy and terms of use. You will
              not be able to access the training materials. If you change your
              mind, you can use your invite link again to return to this page.
            </Text>
            <Button
              appearance="secondary"
              size="medium"
              onClick={() => setDeclined(false)}
            >
              Go Back and Review
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Consent Prompt ────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Error Banner */}
        {error && (
          <div className={styles.errorContainer}>
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Error</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Re-consent Banner */}
        {consentStatus?.requires_reconsent && (
          <div className={styles.reconsentBanner}>
            <MessageBar intent="info">
              <MessageBarBody>
                <MessageBarTitle>Updated Policies</MessageBarTitle>
                Our privacy policy and terms of use have been updated since your
                last visit. Please review and accept the updated policies to
                continue.
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Header */}
        <div className={styles.headerSection}>
          <div className={styles.headerIcon}>
            <div className={styles.iconCircle}>
              <Shield20Regular
                style={{ fontSize: 28, color: tokens.colorBrandForeground1 }}
              />
            </div>
          </div>
          <Text as="h1" size={700} weight="bold" block>
            Privacy & Consent
          </Text>
          <Text as="p" size={400} className={styles.subtitle} block>
            Before accessing your training materials, please review our privacy
            policy, terms of use, and cookie policy.
          </Text>
          {consentContent && (
            <Text as="p" size={200} className={styles.lastUpdated} block>
              Last updated: {consentContent.last_updated}
              <span className={styles.versionBadge} style={{ marginLeft: 8 }}>
                v{consentContent.policy_version}
              </span>
            </Text>
          )}
        </div>

        {consentContent && (
          <>
            {/* Privacy Policy Card */}
            <Card className={styles.policyCard}>
              <CardHeader
                image={
                  <Shield20Regular
                    style={{ color: tokens.colorBrandForeground1 }}
                  />
                }
                header={
                  <Text weight="semibold" size={400}>
                    {consentContent.privacy_policy_title}
                  </Text>
                }
                description={
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Version {consentContent.privacy_policy_version}
                  </Text>
                }
              />
              <div
                className={mergeClasses(
                  styles.scrollableContent,
                  styles.markdown
                )}
              >
                <ReactMarkdown>
                  {consentContent.privacy_policy_content}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Terms of Use Card */}
            <Card className={styles.policyCard}>
              <CardHeader
                image={
                  <DocumentText20Regular
                    style={{ color: tokens.colorBrandForeground1 }}
                  />
                }
                header={
                  <Text weight="semibold" size={400}>
                    {consentContent.terms_title}
                  </Text>
                }
                description={
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Version {consentContent.terms_version}
                  </Text>
                }
              />
              <div
                className={mergeClasses(
                  styles.scrollableContent,
                  styles.markdown
                )}
              >
                <ReactMarkdown>
                  {consentContent.terms_content}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Cookie Policy Card */}
            <Card className={styles.policyCard}>
              <CardHeader
                image={
                  <Cookies20Regular
                    style={{ color: tokens.colorBrandForeground1 }}
                  />
                }
                header={
                  <Text weight="semibold" size={400}>
                    {consentContent.cookie_policy_title}
                  </Text>
                }
                description={
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Essential cookies only
                  </Text>
                }
              />
              <div
                className={mergeClasses(
                  styles.scrollableContent,
                  styles.markdown
                )}
              >
                <ReactMarkdown>
                  {consentContent.cookie_policy_content}
                </ReactMarkdown>
              </div>
            </Card>

            <Divider />

            {/* Consent Checkboxes */}
            <div className={styles.consentSection}>
              <Card className={styles.consentCard}>
                <CardHeader
                  image={
                    <Info20Regular
                      style={{ color: tokens.colorBrandForeground1 }}
                    />
                  }
                  header={
                    <Text weight="semibold" size={400}>
                      Your Consent
                    </Text>
                  }
                  description={
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      All checkboxes must be accepted to proceed
                    </Text>
                  }
                />
                <div className={styles.consentCardContent}>
                  <div className={styles.checkboxWrapper}>
                    <Checkbox
                      checked={privacyAccepted}
                      onChange={(_ev, data) =>
                        setPrivacyAccepted(data.checked === true)
                      }
                      label="I have read and understand the Privacy Policy"
                      disabled={submitting}
                    />
                    <Checkbox
                      checked={termsAccepted}
                      onChange={(_ev, data) =>
                        setTermsAccepted(data.checked === true)
                      }
                      label="I have read and accept the Terms of Use"
                      disabled={submitting}
                    />
                    <Checkbox
                      checked={cookiesAccepted}
                      onChange={(_ev, data) =>
                        setCookiesAccepted(data.checked === true)
                      }
                      label="I accept the use of essential cookies as described in the Cookie Policy"
                      disabled={submitting}
                    />
                    <Checkbox
                      checked={dataProcessingAccepted}
                      onChange={(_ev, data) =>
                        setDataProcessingAccepted(data.checked === true)
                      }
                      label={consentContent.consent_prompt}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionSection}>
              <div className={styles.actionButtons}>
                <Button
                  appearance="primary"
                  size="large"
                  className={styles.acceptButton}
                  disabled={!allAccepted || submitting}
                  onClick={handleAccept}
                  icon={submitting ? <Spinner size="tiny" /> : undefined}
                >
                  {submitting ? "Recording consent..." : "Accept & Continue"}
                </Button>
                <Button
                  appearance="subtle"
                  size="large"
                  className={styles.declineButton}
                  disabled={submitting}
                  onClick={() => setDeclineDialogOpen(true)}
                >
                  Decline
                </Button>
              </div>
              <Text size={200} className={styles.declineNote} block>
                You must accept all policies to access the training materials.
                Declining will prevent access.
              </Text>
            </div>

            {/* Decline Confirmation Dialog */}
            <Dialog
              open={declineDialogOpen}
              onOpenChange={(_ev, data) =>
                setDeclineDialogOpen(data.open)
              }
            >
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Decline Privacy & Consent?</DialogTitle>
                  <DialogContent>
                    <Text block>
                      Are you sure you want to decline the privacy policy, terms
                      of use, and cookie policy?
                    </Text>
                    <div className={styles.declineDialogWarning}>
                      <Warning20Regular
                        style={{
                          color: tokens.colorStatusWarningForeground1,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      <div>
                        <Text weight="semibold" block>
                          If you decline, you will not be able to:
                        </Text>
                        <ul className={styles.declineDialogList}>
                          <li>
                            <Text size={300}>
                              Access the interactive training walkthrough
                            </Text>
                          </li>
                          <li>
                            <Text size={300}>
                              View per-entity reference documentation
                            </Text>
                          </li>
                          <li>
                            <Text size={300}>
                              Track your training progress
                            </Text>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Text
                      size={300}
                      style={{ color: tokens.colorNeutralForeground3 }}
                      block
                    >
                      You can return to this page at any time using your invite
                      link to review and accept the policies.
                    </Text>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Go Back</Button>
                    </DialogTrigger>
                    <Button
                      appearance="primary"
                      style={{
                        backgroundColor: tokens.colorStatusDangerBackground3,
                      }}
                      onClick={handleDeclineConfirm}
                    >
                      Decline & Leave
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
