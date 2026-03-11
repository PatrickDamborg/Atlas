"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { AppSelectionPanel } from "@/components/app-selection";
import type { AppSelectionResponse } from "@/types/appModule";

export default function SelectAppPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  const handleSelectionConfirmed = useCallback(
    (selection: AppSelectionResponse) => {
      // Navigate to the next step after successful selection
      // For now, navigate back to the project root (will be wired to pipeline later)
      router.push(`/projects/${params.projectId}`);
    },
    [router, params.projectId]
  );

  return (
    <AppSelectionPanel
      projectId={params.projectId}
      onSelectionConfirmed={handleSelectionConfirmed}
    />
  );
}
