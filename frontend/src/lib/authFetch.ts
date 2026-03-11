/**
 * Authenticated fetch wrapper for consultant API calls.
 *
 * Acquires an access token from MSAL silently and attaches it
 * as a Bearer token in the Authorization header.
 *
 * This module is used by the API client (api.ts) for all
 * consultant-facing endpoints.
 */

import { msalInstance } from "@/components/auth/MsalAuthProvider";
import { apiTokenRequest } from "@/lib/msalConfig";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

/**
 * Get the current access token for API calls.
 * Returns null if no user is signed in (for public routes).
 */
export async function getAccessToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...apiTokenRequest,
      account,
    });
    return response.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      // Redirect to login — this will navigate away
      await msalInstance.acquireTokenRedirect({
        ...apiTokenRequest,
        account,
      });
      return null;
    }
    console.error("[authFetch] Token acquisition failed:", err);
    return null;
  }
}

/**
 * Wrapper around fetch that automatically attaches the auth token.
 * Falls through without token for unauthenticated contexts (public routes).
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
