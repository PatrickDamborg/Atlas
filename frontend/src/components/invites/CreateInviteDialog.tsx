"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  SpinButton,
  Label,
  Text,
  Switch,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { LinkAdd24Regular } from "@fluentui/react-icons";
import type { InviteLinkCreateRequest } from "@/types/invite";

const useStyles = makeStyles({
  field: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalM,
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
});

interface CreateInviteDialogProps {
  onSubmit: (data: InviteLinkCreateRequest) => Promise<void>;
  isSubmitting?: boolean;
  seatsAvailable: number;
}

export function CreateInviteDialog({
  onSubmit,
  isSubmitting = false,
  seatsAvailable,
}: CreateInviteDialogProps) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [hasMaxUses, setHasMaxUses] = useState(false);
  const [maxUses, setMaxUses] = useState(10);
  const [hasCustomExpiry, setHasCustomExpiry] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setLabel("");
    setHasMaxUses(false);
    setMaxUses(10);
    setHasCustomExpiry(false);
    setExpiresInDays(30);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const data: InviteLinkCreateRequest = {
      label: label.trim() || null,
      max_uses: hasMaxUses ? maxUses : null,
      expires_in_days: hasCustomExpiry ? expiresInDays : null,
    };

    try {
      await onSubmit(data);
      resetForm();
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invite link");
    }
  }, [label, hasMaxUses, maxUses, hasCustomExpiry, expiresInDays, onSubmit, resetForm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        setOpen(d.open);
        if (d.open) resetForm();
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<LinkAdd24Regular />}
          disabled={seatsAvailable <= 0}
        >
          Generate Invite Link
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Generate New Invite Link</DialogTitle>
          <DialogContent>
            {seatsAvailable <= 0 && (
              <Text
                style={{
                  color: tokens.colorPaletteRedForeground1,
                  marginBottom: 12,
                  display: "block",
                }}
                size={300}
              >
                No seats available. Increase the seat limit before generating
                new invite links.
              </Text>
            )}

            <div className={styles.field}>
              <Label htmlFor="invite-label">
                Label (optional)
              </Label>
              <Input
                id="invite-label"
                placeholder="e.g. Sales Team Batch 1"
                value={label}
                onChange={(_, d) => setLabel(d.value)}
                maxLength={255}
              />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                A descriptive name to identify this invite link
              </Text>
            </div>

            <div className={styles.switchRow}>
              <Switch
                checked={hasMaxUses}
                onChange={(_, d) => setHasMaxUses(d.checked)}
                label="Limit number of uses"
              />
            </div>
            {hasMaxUses && (
              <div className={styles.field}>
                <Label htmlFor="max-uses">Maximum Uses</Label>
                <SpinButton
                  id="max-uses"
                  value={maxUses}
                  min={1}
                  max={seatsAvailable}
                  step={1}
                  onChange={(_, d) => {
                    if (d.value !== undefined && d.value !== null) {
                      setMaxUses(d.value);
                    }
                  }}
                />
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {seatsAvailable} seat(s) currently available
                </Text>
              </div>
            )}

            <div className={styles.switchRow}>
              <Switch
                checked={hasCustomExpiry}
                onChange={(_, d) => setHasCustomExpiry(d.checked)}
                label="Custom expiry"
              />
            </div>
            {hasCustomExpiry && (
              <div className={styles.field}>
                <Label htmlFor="expires-days">Expires In (days)</Label>
                <SpinButton
                  id="expires-days"
                  value={expiresInDays}
                  min={1}
                  max={365}
                  step={1}
                  onChange={(_, d) => {
                    if (d.value !== undefined && d.value !== null) {
                      setExpiresInDays(d.value);
                    }
                  }}
                />
              </div>
            )}

            {error && (
              <Text
                style={{ color: tokens.colorPaletteRedForeground1, marginTop: 8 }}
                size={200}
              >
                {error}
              </Text>
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || seatsAvailable <= 0}
            >
              {isSubmitting ? "Generating..." : "Generate Link"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
