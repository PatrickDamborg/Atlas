"use client";

/**
 * Authentication hook for consultant SSO.
 *
 * Provides:
 * - isAuthenticated / isLoading state
 * - Current user account info
 * - login() / logout() actions
 * - getAccessToken() for API calls
 */

import { useCallback } from "react";
import {
  useMsal,
  useIsAuthenticated,
  useAccount,
} from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest, apiTokenRequest } from "@/lib/msalConfig";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
}

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = useAccount(accounts[0] ?? null);

  const isLoading = inProgress !== "none";

  /**
   * Map the MSAL account to our AuthUser shape.
   */
  const user: AuthUser | null =
    account
      ? {
          id: account.localAccountId,
          email: account.username ?? "",
          displayName: account.name ?? account.username ?? "Consultant",
          tenantId: account.tenantId ?? "",
        }
      : null;

  /**
   * Initiate login via redirect to Microsoft login page.
   */
  const login = useCallback(async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error("[useAuth] Login failed:", err);
      throw err;
    }
  }, [instance]);

  /**
   * Sign out and redirect to post-logout URI.
   */
  const logout = useCallback(async () => {
    try {
      await instance.logoutRedirect({
        account: account ?? undefined,
      });
    } catch (err) {
      console.error("[useAuth] Logout failed:", err);
      throw err;
    }
  }, [instance, account]);

  /**
   * Silently acquire an access token for backend API calls.
   * Falls back to interactive login if the silent call fails
   * (e.g. token expired and refresh token is also expired).
   */
  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!account) {
      throw new Error("No authenticated account. Please log in.");
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...apiTokenRequest,
        account,
      });
      return response.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Token can't be refreshed silently — redirect to login
        await instance.acquireTokenRedirect({
          ...apiTokenRequest,
          account,
        });
        // This won't return — page redirects
        return "";
      }
      throw err;
    }
  }, [instance, account]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    getAccessToken,
  };
}
