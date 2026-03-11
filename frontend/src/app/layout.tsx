import type { Metadata } from "next";
import { FluentProviderWrapper } from "@/components/FluentProviderWrapper";
import { AuthProviderWrapper } from "@/components/auth/AuthProviderWrapper";

export const metadata: Metadata = {
  title: "Forge Atlas",
  description: "AI-powered Dynamics 365 training walkthrough generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <FluentProviderWrapper>
          <AuthProviderWrapper>{children}</AuthProviderWrapper>
        </FluentProviderWrapper>
      </body>
    </html>
  );
}
