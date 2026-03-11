"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { AppPickerPanel } from "@/components/app-picker";
import type { TrainingTrack } from "@/types/trainingTrack";

/**
 * Training Tracks page — the top-level app picker for a project.
 *
 * Displays all available training tracks and lets the user select
 * one to open the walkthrough viewer.
 */
export default function TrainingPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  const handleTrackSelect = useCallback(
    (track: TrainingTrack) => {
      // Navigate to the walkthrough viewer for the selected app
      router.push(
        `/projects/${params.projectId}/training/${track.app_unique_name}`
      );
    },
    [router, params.projectId]
  );

  return (
    <AppPickerPanel
      projectId={params.projectId}
      onTrackSelect={handleTrackSelect}
    />
  );
}
