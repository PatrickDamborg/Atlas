"use client";

/**
 * Lightweight identity capture form for end users.
 *
 * Shown after the consent prompt has been accepted. Collects a display
 * name and email address, validates the email format client-side, then
 * submits to the backend to create a seat + session and redirect to the
 * training walkthrough.
 */

import { useCallback, useState } from "react";
import {
  Body1,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Subtitle1,
  Text,
  Title3,
  tokens,
  makeStyles,
} from "@fluentui/react-components";
import {
  PersonRegular,
  MailRegular,
  ArrowRightRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { captureIdentity, ApiError } from "@/lib/api";
import type { IdentityCaptureResponse } from "@/types/end-user";

// ── Email validation ─────────────────────────────────────────────────

/**
 * Validates email format per RFC 5322 simplified pattern.
 * Covers the vast majority of valid email addresses without being overly strict.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email address is required.";
  if (!EMAIL_REGEX.test(email.trim())) return "Please enter a valid email address.";
  if (email.trim().length > 320) return "Email address is too long.";
  return undefined;
}

function validateDisplayName(name: string): string | undefined {
  if (!name.trim()) return "Display name is required.";
  if (name.trim().length > 255) return "Display name is too long (max 255 characters).";
  return undefined;
}

// ── Styles ───────────────────────────────────────────────────────────

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
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  projectBadge: {
    display: "inline-block",
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    padding: "4px 12px",
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: "12px",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: "8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  submitButton: {
    marginTop: "8px",
    height: "40px",
  },
  messageBar: {
    marginBottom: "16px",
  },
  successContainer: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: "48px",
  },
  footer: {
    marginTop: "16px",
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

// ── Props ────────────────────────────────────────────────────────────

interface IdentityCaptureFormProps {
  /** The invite token from the URL. */
  token: string;
  /** Project name to display on the form. */
  projectName: string | null;
  /** Callback fired on successful identity capture. */
  onSuccess: (response: IdentityCaptureResponse) => void;
  /** Callback fired when the backend returns a 403 seat-limit error. */
  onSeatLimitReached?: (detail: string, adminContactEmail?: string | null) => void;
}

// ── Component ────────────────────────────────────────────────────────

export function IdentityCaptureForm({
  token,
  projectName,
  onSuccess,
  onSeatLimitReached,
}: IdentityCaptureFormProps) {
  const styles = useStyles();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<IdentityCaptureResponse | null>(null);

  // Validation state — only shown after field is touched or form submitted
  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Server error
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleNameBlur = useCallback(() => {
    setNameTouched(true);
    setNameError(validateDisplayName(displayName));
  }, [displayName]);

  const handleEmailBlur = useCallback(() => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  }, [email]);

  const handleNameChange = useCallback(
    (_: unknown, data: { value: string }) => {
      setDisplayName(data.value);
      if (nameTouched) {
        setNameError(validateDisplayName(data.value));
      }
    },
    [nameTouched]
  );

  const handleEmailChange = useCallback(
    (_: unknown, data: { value: string }) => {
      setEmail(data.value);
      if (emailTouched) {
        setEmailError(validateEmail(data.value));
      }
    },
    [emailTouched]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      // Validate all fields
      const newNameError = validateDisplayName(displayName);
      const newEmailError = validateEmail(email);
      setNameTouched(true);
      setEmailTouched(true);
      setNameError(newNameError);
      setEmailError(newEmailError);

      if (newNameError || newEmailError) return;

      setIsSubmitting(true);

      try {
        const response = await captureIdentity(token, {
          display_name: displayName.trim(),
          email: email.trim().toLowerCase(),
          consent_given: true, // Already accepted in prior consent step
        });

        setSuccess(response);

        // Store session token for subsequent API calls
        if (typeof window !== "undefined") {
          sessionStorage.setItem("forge_session_token", response.session_token);
          sessionStorage.setItem("forge_project_id", response.project_id);
          sessionStorage.setItem("forge_display_name", response.display_name);
        }

        // Notify parent and trigger redirect
        onSuccess(response);
      } catch (err) {
        if (err instanceof ApiError) {
          // 403 from the backend means seat limit reached — transition to
          // the hard-block UI instead of showing a generic form error.
          if (err.status === 403 && onSeatLimitReached) {
            const adminEmail = err.data?.admin_contact_email as string | null | undefined;
            onSeatLimitReached(err.message, adminEmail);
            return;
          }
          setServerError(err.message);
        } else {
          setServerError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, displayName, email, onSuccess, onSeatLimitReached]
  );

  // ── Success State ────────────────────────────────────────────────

  if (success) {
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.successContainer}>
            <CheckmarkCircleRegular
              className={styles.successIcon}
              aria-hidden
            />
            <Title3>{success.message}</Title3>
            <Body1 className={styles.subtitle}>
              {success.is_returning_user
                ? `Welcome back, ${success.display_name}! Resuming your training.`
                : `Welcome, ${success.display_name}! Setting up your training environment.`}
            </Body1>
            <Spinner label="Redirecting to training..." size="small" />
          </div>
        </Card>
      </div>
    );
  }

  // ── Form State ───────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          {projectName && (
            <div className={styles.projectBadge}>{projectName}</div>
          )}
          <Title3 as="h1" block>
            Get Started
          </Title3>
          <Body1 className={styles.subtitle}>
            Enter your name and email to access the training walkthrough.
          </Body1>
        </div>

        {/* Server Error */}
        {serverError && (
          <MessageBar intent="error" className={styles.messageBar}>
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {serverError}
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Field
            label="Display Name"
            required
            validationState={nameTouched && nameError ? "error" : "none"}
            validationMessage={nameTouched ? nameError : undefined}
          >
            <Input
              value={displayName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="Your full name"
              contentBefore={<PersonRegular />}
              disabled={isSubmitting}
              autoComplete="name"
              autoFocus
            />
          </Field>

          <Field
            label="Email Address"
            required
            validationState={emailTouched && emailError ? "error" : "none"}
            validationMessage={emailTouched ? emailError : undefined}
            hint="Used to identify your account and track progress."
          >
            <Input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              contentBefore={<MailRegular />}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </Field>

          <Button
            type="submit"
            appearance="primary"
            className={styles.submitButton}
            disabled={isSubmitting}
            icon={isSubmitting ? <Spinner size="tiny" /> : <ArrowRightRegular />}
            iconPosition="after"
          >
            {isSubmitting ? "Joining..." : "Join Training"}
          </Button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <Text size={200}>
            By continuing, you confirm that you have read and accepted the Privacy
            Policy and Terms of Use.
          </Text>
        </div>
      </Card>
    </div>
  );
}
