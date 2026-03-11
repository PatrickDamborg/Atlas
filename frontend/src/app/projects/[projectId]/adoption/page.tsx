"use client";

import { useParams } from "next/navigation";
import { AdoptionDashboardPage } from "@/components/adoption-dashboard";

export default function AdoptionPage() {
  const params = useParams<{ projectId: string }>();
  return <AdoptionDashboardPage projectId={params.projectId} />;
}
