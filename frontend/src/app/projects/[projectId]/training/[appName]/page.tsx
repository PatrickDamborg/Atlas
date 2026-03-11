"use client";

import { useParams } from "next/navigation";
import { TrainingWalkthroughViewer } from "@/components/training-viewer";

/**
 * Walkthrough viewer page for a specific app's training content.
 *
 * The app picker dropdown in the viewer header allows switching between
 * apps without navigating away. The route parameter `appName` sets the
 * initially selected app.
 */
export default function AppWalkthroughPage() {
  const params = useParams<{ projectId: string; appName: string }>();

  return (
    <TrainingWalkthroughViewer
      projectId={params.projectId}
      initialAppName={decodeURIComponent(params.appName)}
    />
  );
}
