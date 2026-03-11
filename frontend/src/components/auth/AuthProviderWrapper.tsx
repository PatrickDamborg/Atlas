"use client";

/**
 * Client-side wrapper that conditionally applies MSAL authentication.
 *
 * Public routes (invite redemption, consent, training viewer for end users)
 * do NOT require Microsoft SSO — they use invite tokens instead.
 * Only consultant routes go through MSAL.
 *
 * This wrapper is imported into the server-component layout.tsx
 * to bridge the client/server boundary.
 */

import React from "react";
import { usePathname } from "next/navigation";
import { MsalAuthProvider } from "./MsalAuthProvider";

/**
 * Route prefixes that are public (no Microsoft SSO required).
 * End-user flows use invite tokens, not Entra ID.
 */
const PUBLIC_ROUTE_PREFIXES = [
  "/invite",
  "/consent",
  "/training",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public routes skip MSAL entirely
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // Consultant routes get MSAL provider
  return <MsalAuthProvider>{children}</MsalAuthProvider>;
}
