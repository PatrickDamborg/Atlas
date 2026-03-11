"use client";

/**
 * Invite link route handler — /invite/[token]
 *
 * This is the Next.js page that serves as the entry point when an
 * end user clicks an invite link URL. It:
 *
 * 1. Extracts the invite token from the dynamic route parameter
 * 2. Delegates to InviteLandingPage which validates the token
 *    against the backend (checking expiry, usage limits, revocation,
 *    seat availability)
 * 3. Routes to the appropriate UI:
 *    - Loading spinner while validating
 *    - Error page if token is invalid/expired/revoked/exhausted
 *    - Identity capture form if token is valid
 *    - Redirect to training walkthrough on successful identity capture
 */

import { useParams } from "next/navigation";
import {
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { InviteLandingPage } from "@/components/invite/InviteLandingPage";

const useStyles = makeStyles({
  fallbackContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    gap: "16px",
  },
});

export default function InviteTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const styles = useStyles();

  // Safety fallback — token should always be present from Next.js routing
  if (!token) {
    return (
      <div className={styles.fallbackContainer}>
        <Spinner size="large" label="Loading..." />
      </div>
    );
  }

  return <InviteLandingPage token={token} />;
}
