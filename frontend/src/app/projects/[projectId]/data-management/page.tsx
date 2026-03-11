"use client";

import { useParams } from "next/navigation";
import { ProjectDataManagementPanel } from "@/components/data-management";
import { AuthGuard } from "@/components/auth";

export default function DataManagementPage() {
  const params = useParams<{ projectId: string }>();
  return (
    <AuthGuard>
      <ProjectDataManagementPanel projectId={params.projectId} />
    </AuthGuard>
  );
}
