"use client";

import { useParams, useRouter } from "next/navigation";
import { EntityDetailPage } from "@/components/entity-reference";

export default function EntityDetailRoute() {
  const params = useParams<{ projectId: string; entityId: string }>();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/projects/${params.projectId}/entities`);
  };

  return (
    <EntityDetailPage
      projectId={params.projectId}
      entityId={params.entityId}
      onBack={handleBack}
    />
  );
}
