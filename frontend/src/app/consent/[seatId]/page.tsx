"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ConsentPromptScreen } from "@/components/consent";

/**
 * Privacy/consent prompt page.
 *
 * Displayed after successful invite link validation and redemption.
 * The end user must accept the privacy policy and terms of use
 * before being redirected to the training walkthrough.
 *
 * Route: /consent/{seatId}
 *
 * The seatId is obtained during invite redemption. Once consent
 * is accepted, the user is redirected to the training content.
 */
export default function ConsentPage() {
  const params = useParams<{ seatId: string }>();
  const router = useRouter();

  const handleConsentAccepted = useCallback(() => {
    // After consent is accepted, redirect to the training content.
    // The training route will use the session token (stored during
    // invite redemption) to authenticate the user.
    router.push(`/training/${params.seatId}`);
  }, [router, params.seatId]);

  return (
    <ConsentPromptScreen
      seatId={params.seatId}
      onConsentAccepted={handleConsentAccepted}
    />
  );
}
