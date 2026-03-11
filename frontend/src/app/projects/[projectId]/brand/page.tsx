"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth";
import { BrandColorPicker } from "@/components/branding";

function BrandSettingsContent() {
  const params = useParams<{ projectId: string }>();

  if (!params.projectId) {
    return null;
  }

  return <BrandColorPicker projectId={params.projectId} />;
}

export default function BrandSettingsPage() {
  return (
    <AuthGuard>
      <BrandSettingsContent />
    </AuthGuard>
  );
}
