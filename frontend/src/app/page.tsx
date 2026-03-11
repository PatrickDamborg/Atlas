"use client";

import { useRouter } from "next/navigation";
import { Text, Button, tokens } from "@fluentui/react-components";
import { SignOutRegular, ArrowUpload24Regular, ShieldLock24Regular } from "@fluentui/react-icons";
import { AuthGuard } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div style={{ padding: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Text size={800} weight="bold">
            Forge Atlas
          </Text>
          <Text as="p" size={400} style={{ marginTop: 8 }}>
            AI-powered Dynamics 365 training walkthrough generator
          </Text>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Text
              size={300}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              {user.displayName} ({user.email})
            </Text>
            <Button
              appearance="subtle"
              icon={<SignOutRegular />}
              onClick={logout}
            >
              Sign out
            </Button>
          </div>
        )}
      </div>

      {/* Primary action: Upload a new solution */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 48,
        }}
      >
        <Button
          appearance="primary"
          size="large"
          icon={<ArrowUpload24Regular />}
          onClick={() => router.push("/upload")}
        >
          Upload Dataverse Solution
        </Button>
        <Text
          size={200}
          style={{ color: tokens.colorNeutralForeground3 }}
        >
          Upload a .zip solution file to begin generating training walkthroughs
        </Text>

        <Button
          appearance="outline"
          size="large"
          icon={<ShieldLock24Regular />}
          onClick={() => router.push("/data-management")}
          style={{ marginTop: 24 }}
        >
          Manage Data (GDPR)
        </Button>
        <Text
          size={200}
          style={{ color: tokens.colorNeutralForeground3 }}
        >
          View, search, and permanently delete end-user data across projects
        </Text>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
