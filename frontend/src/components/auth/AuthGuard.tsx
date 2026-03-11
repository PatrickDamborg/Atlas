"use client";

/**
 * Route guard that requires Microsoft SSO authentication.
 *
 * Usage:
 *   <AuthGuard>
 *     <ProtectedPageContent />
 *   </AuthGuard>
 *
 * If the user is not authenticated:
 *   - Shows the LoginPage component with a sign-in button
 * While authentication is loading:
 *   - Shows a spinner
 */

import React from "react";
import {
  Spinner,
  tokens,
} from "@fluentui/react-components";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "./LoginPage";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Optional: show a custom fallback while loading instead of default spinner */
  loadingFallback?: React.ReactNode;
}

export function AuthGuard({ children, loadingFallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: tokens.colorNeutralBackground1,
          }}
        >
          <Spinner size="large" label="Authenticating..." />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
