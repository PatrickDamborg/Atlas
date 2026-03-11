"use client";

/**
 * OAuth 2.0 / OIDC callback page.
 *
 * After Microsoft Entra ID authenticates the user, it redirects here.
 * MSAL handles the token exchange automatically via handleRedirectPromise()
 * in MsalAuthProvider. This page shows a loading spinner while that completes,
 * then redirects to the main app.
 *
 * Redirect URI registered in Entra ID: http://localhost:3000/auth/callback
 */

import React, { useEffect } from "react";
import { Spinner, tokens } from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Once MSAL finishes processing the redirect, navigate to the app
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 16,
        backgroundColor: tokens.colorNeutralBackground1,
      }}
    >
      <Spinner size="large" label="Completing sign-in..." />
    </div>
  );
}
