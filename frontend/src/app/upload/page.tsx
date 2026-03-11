"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth";
import { SolutionUploadPanel } from "@/components/solution-upload";
import type { UploadSolutionResponse } from "@/types/upload";

function UploadPageContent() {
  const router = useRouter();

  const handleUploadComplete = useCallback(
    (response: UploadSolutionResponse) => {
      // Navigate to the app selection step for the new project
      router.push(`/projects/${response.project_id}/select-app`);
    },
    [router]
  );

  return <SolutionUploadPanel onUploadComplete={handleUploadComplete} />;
}

export default function UploadPage() {
  return (
    <AuthGuard>
      <UploadPageContent />
    </AuthGuard>
  );
}
