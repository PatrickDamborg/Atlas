"use client";

/**
 * Login page shown when a consultant is not authenticated.
 *
 * Displays branding and a "Sign in with Microsoft" button that triggers
 * the MSAL redirect flow to Azure Entra ID.
 */

import React, { useState } from "react";
import {
  Button,
  Text,
  Card,
  CardHeader,
  tokens,
  Spinner,
} from "@fluentui/react-components";
import {
  PersonAccountsRegular,
  ShieldKeyholeRegular,
} from "@fluentui/react-icons";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again."
      );
      setIsSigningIn(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: tokens.colorNeutralBackground3,
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 420,
          width: "100%",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <CardHeader
          image={
            <ShieldKeyholeRegular
              style={{ fontSize: 48, color: tokens.colorBrandForeground1 }}
            />
          }
          header={
            <Text size={700} weight="bold">
              Forge Atlas
            </Text>
          }
          description={
            <Text
              size={300}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              AI-powered Dynamics 365 Training Generator
            </Text>
          }
        />

        <div style={{ marginTop: 32 }}>
          <Text
            as="p"
            size={400}
            style={{
              marginBottom: 24,
              color: tokens.colorNeutralForeground2,
            }}
          >
            Sign in with your Microsoft account to access the consultant
            portal.
          </Text>

          <Button
            appearance="primary"
            size="large"
            icon={
              isSigningIn ? (
                <Spinner size="tiny" />
              ) : (
                <PersonAccountsRegular />
              )
            }
            onClick={handleSignIn}
            disabled={isSigningIn}
            style={{ width: "100%" }}
          >
            {isSigningIn ? "Redirecting..." : "Sign in with Microsoft"}
          </Button>

          {error && (
            <Text
              as="p"
              size={300}
              style={{
                marginTop: 16,
                color: tokens.colorPaletteRedForeground1,
              }}
            >
              {error}
            </Text>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <Text
            size={200}
            style={{ color: tokens.colorNeutralForeground4 }}
          >
            Protected by Microsoft Entra ID single sign-on. Only authorised
            consultants can access this portal.
          </Text>
        </div>
      </Card>
    </div>
  );
}
