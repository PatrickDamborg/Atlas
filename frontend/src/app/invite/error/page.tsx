"use client";

/**
 * Standalone invite error page — /invite/error
 *
 * Used for redirect-based error handling when the invite token cannot
 * be validated. Reads error details from URL search params so other
 * parts of the app can redirect here with context.
 *
 * Supported query params:
 *   - code: Error code (e.g. INVITE_EXPIRED, INVITE_REVOKED)
 *   - message: Human-readable error message
 *   - project: Project name (optional)
 */

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Spinner, makeStyles, tokens } from "@fluentui/react-components";
import { InviteErrorState } from "@/components/invite/InviteErrorState";

const useStyles = makeStyles({
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    gap: "16px",
  },
});

function InviteErrorContent() {
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("code") ?? "UNKNOWN_ERROR";
  const errorMessage =
    searchParams.get("message") ??
    "This invite link cannot be used. Please contact your administrator.";
  const projectName = searchParams.get("project") ?? null;

  return (
    <InviteErrorState
      errorCode={errorCode}
      errorMessage={errorMessage}
      projectName={projectName}
    />
  );
}

export default function InviteErrorPage() {
  const styles = useStyles();

  return (
    <Suspense
      fallback={
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading..." />
        </div>
      }
    >
      <InviteErrorContent />
    </Suspense>
  );
}
