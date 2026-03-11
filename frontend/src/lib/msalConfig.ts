/**
 * MSAL (Microsoft Authentication Library) configuration for Azure Entra ID SSO.
 *
 * Environment variables are read at build time via Next.js public env vars.
 * In production these are set in Azure App Service configuration.
 */

import { Configuration, LogLevel } from "@azure/msal-browser";

/**
 * MSAL configuration object.
 *
 * NEXT_PUBLIC_AZURE_CLIENT_ID  – App registration client ID from Entra ID
 * NEXT_PUBLIC_AZURE_TENANT_ID  – Directory (tenant) ID; use "common" for multi-tenant
 * NEXT_PUBLIC_AZURE_REDIRECT_URI – Redirect URI registered in the app registration
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? "",
    authority: `https://login.microsoftonline.com/${
      process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? "common"
    }`,
    redirectUri:
      process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI ?? "http://localhost:3000",
    postLogoutRedirectUri:
      process.env.NEXT_PUBLIC_AZURE_POST_LOGOUT_URI ?? "http://localhost:3000",
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error("[MSAL]", message);
            break;
          case LogLevel.Warning:
            console.warn("[MSAL]", message);
            break;
          case LogLevel.Info:
            // Only log in development
            if (process.env.NODE_ENV === "development") {
              console.info("[MSAL]", message);
            }
            break;
        }
      },
      logLevel:
        process.env.NODE_ENV === "development"
          ? LogLevel.Info
          : LogLevel.Warning,
    },
  },
};

/**
 * Scopes requested during login.
 *
 * "User.Read" gives us the signed-in user's profile.
 * The API scope is for accessing our own FastAPI backend.
 */
export const loginRequest = {
  scopes: [
    "User.Read",
    "openid",
    "profile",
    "email",
  ],
};

/**
 * Scopes for acquiring tokens to call our backend API.
 * The custom scope should match the API app registration's "Expose an API" setting.
 */
export const apiTokenRequest = {
  scopes: process.env.NEXT_PUBLIC_AZURE_API_SCOPE
    ? [process.env.NEXT_PUBLIC_AZURE_API_SCOPE]
    : ["User.Read"],
};
