"use client";

/**
 * Top-level MSAL authentication provider.
 *
 * Wraps the application in MsalProvider from @azure/msal-react and handles
 * the redirect promise on mount (for post-login redirect flow).
 */

import React, { useEffect, useState } from "react";
import {
  PublicClientApplication,
  EventType,
  type AuthenticationResult,
} from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "@/lib/msalConfig";

// Singleton MSAL instance — created once at module level
const msalInstance = new PublicClientApplication(msalConfig);

export function MsalAuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Initialize MSAL and handle any pending redirect
      await msalInstance.initialize();
      const response = await msalInstance.handleRedirectPromise();

      if (response) {
        // Set the account that just logged in as active
        msalInstance.setActiveAccount(response.account);
      }

      // If no active account, try to pick one from cache
      if (!msalInstance.getActiveAccount()) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }
      }

      // Listen for login success events to update active account
      msalInstance.addEventCallback((event) => {
        if (
          event.eventType === EventType.LOGIN_SUCCESS &&
          event.payload
        ) {
          const payload = event.payload as AuthenticationResult;
          msalInstance.setActiveAccount(payload.account);
        }
      });

      setIsInitialized(true);
    };

    init().catch((err) => {
      console.error("[MsalAuthProvider] Initialization failed:", err);
      setIsInitialized(true); // Still render so error states can show
    });
  }, []);

  if (!isInitialized) {
    // Show nothing while MSAL initializes (avoids flash)
    return null;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export { msalInstance };
