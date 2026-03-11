"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  TrackNavigationState,
  TrackNavigationMap,
  WalkthroughTrack,
} from "@/types/trainingTrack";

/**
 * Hook to manage per-track navigation state across multiple training tracks.
 *
 * Maintains the current step index for each track independently, so
 * switching between apps/tracks preserves the user's position.
 */
export function useTrackNavigation() {
  const [navMap, setNavMap] = useState<TrackNavigationMap>({});

  /** Initialize or reset navigation state for all tracks of an app */
  const initializeTracks = useCallback((tracks: WalkthroughTrack[]) => {
    setNavMap((prev) => {
      const next = { ...prev };
      for (const track of tracks) {
        // Only initialize if not already present (preserve position)
        if (!next[track.track_id]) {
          next[track.track_id] = {
            trackId: track.track_id,
            currentStepIndex: 0,
            totalSteps: track.annotations.length,
            completed: false,
          };
        }
      }
      return next;
    });
  }, []);

  /** Get current navigation state for a track */
  const getTrackState = useCallback(
    (trackId: string): TrackNavigationState | undefined => {
      return navMap[trackId];
    },
    [navMap]
  );

  /** Navigate to a specific step in a track */
  const goToStep = useCallback((trackId: string, stepIndex: number) => {
    setNavMap((prev) => {
      const trackState = prev[trackId];
      if (!trackState) return prev;

      const clampedIndex = Math.max(
        0,
        Math.min(stepIndex, trackState.totalSteps - 1)
      );

      return {
        ...prev,
        [trackId]: {
          ...trackState,
          currentStepIndex: clampedIndex,
          completed: clampedIndex === trackState.totalSteps - 1,
        },
      };
    });
  }, []);

  /** Go to next step in a track */
  const nextStep = useCallback(
    (trackId: string) => {
      const state = navMap[trackId];
      if (!state) return;
      goToStep(trackId, state.currentStepIndex + 1);
    },
    [navMap, goToStep]
  );

  /** Go to previous step in a track */
  const prevStep = useCallback(
    (trackId: string) => {
      const state = navMap[trackId];
      if (!state) return;
      goToStep(trackId, state.currentStepIndex - 1);
    },
    [navMap, goToStep]
  );

  /** Reset a specific track to the beginning */
  const resetTrack = useCallback((trackId: string) => {
    setNavMap((prev) => {
      const trackState = prev[trackId];
      if (!trackState) return prev;
      return {
        ...prev,
        [trackId]: {
          ...trackState,
          currentStepIndex: 0,
          completed: false,
        },
      };
    });
  }, []);

  /** Check if on first step */
  const isFirstStep = useCallback(
    (trackId: string): boolean => {
      return (navMap[trackId]?.currentStepIndex ?? 0) === 0;
    },
    [navMap]
  );

  /** Check if on last step */
  const isLastStep = useCallback(
    (trackId: string): boolean => {
      const state = navMap[trackId];
      if (!state || state.totalSteps === 0) return true;
      return state.currentStepIndex >= state.totalSteps - 1;
    },
    [navMap]
  );

  return {
    navMap,
    initializeTracks,
    getTrackState,
    goToStep,
    nextStep,
    prevStep,
    resetTrack,
    isFirstStep,
    isLastStep,
  };
}
