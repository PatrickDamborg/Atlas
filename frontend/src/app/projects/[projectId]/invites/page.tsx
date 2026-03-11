"use client";

import { useParams } from "next/navigation";
import { InviteManagementPage } from "@/components/invites";

export default function InvitesPage() {
  const params = useParams<{ projectId: string }>();
  return <InviteManagementPage projectId={params.projectId} />;
}
