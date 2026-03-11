"use client";

import { useParams, useRouter } from "next/navigation";
import { EntityDocsIndex } from "@/components/entity-reference/EntityDocsIndex";

export default function EntityDocsIndexRoute() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  const handleEntitySelect = (entityId: string) => {
    router.push(`/projects/${params.projectId}/entities/${entityId}`);
  };

  return (
    <EntityDocsIndex
      projectId={params.projectId}
      onEntitySelect={handleEntitySelect}
    />
  );
}
