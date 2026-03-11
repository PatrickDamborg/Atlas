"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Text,
  Tooltip,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Switch,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import {
  Copy24Regular,
  Dismiss24Regular,
  CheckmarkCircle16Regular,
  Clock16Regular,
  ErrorCircle16Regular,
  DismissCircle16Regular,
} from "@fluentui/react-icons";
import type { InviteLinkResponse } from "@/types/invite";

const useStyles = makeStyles({
  container: {
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
  },
  emptyState: {
    textAlign: "center",
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  tokenCell: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  tokenText: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  copySuccess: {
    marginTop: tokens.spacingVerticalS,
  },
});

function statusBadge(status: InviteLinkResponse["status"]) {
  switch (status) {
    case "active":
      return (
        <Badge
          appearance="filled"
          color="success"
          icon={<CheckmarkCircle16Regular />}
        >
          Active
        </Badge>
      );
    case "expired":
      return (
        <Badge
          appearance="filled"
          color="warning"
          icon={<Clock16Regular />}
        >
          Expired
        </Badge>
      );
    case "revoked":
      return (
        <Badge
          appearance="filled"
          color="danger"
          icon={<DismissCircle16Regular />}
        >
          Revoked
        </Badge>
      );
    case "exhausted":
      return (
        <Badge
          appearance="filled"
          color="informative"
          icon={<ErrorCircle16Regular />}
        >
          Exhausted
        </Badge>
      );
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface InviteLinkTableProps {
  invites: InviteLinkResponse[];
  onRevoke: (inviteId: string) => Promise<void>;
  showRevoked: boolean;
  onToggleShowRevoked: (show: boolean) => void;
  isRevoking?: boolean;
}

export function InviteLinkTable({
  invites,
  onRevoke,
  showRevoked,
  onToggleShowRevoked,
  isRevoking = false,
}: InviteLinkTableProps) {
  const styles = useStyles();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<InviteLinkResponse | null>(null);

  const handleCopy = useCallback(async (invite: InviteLinkResponse) => {
    try {
      await navigator.clipboard.writeText(invite.invite_url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for non-HTTPS contexts
      const input = document.createElement("input");
      input.value = invite.invite_url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return;
    await onRevoke(revokeTarget.id);
    setRevokeTarget(null);
  }, [revokeTarget, onRevoke]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text weight="semibold" size={500}>
          Invite Links
        </Text>
        <Switch
          checked={showRevoked}
          onChange={(_, d) => onToggleShowRevoked(d.checked)}
          label="Show revoked"
        />
      </div>

      {copiedId && (
        <MessageBar intent="success" className={styles.copySuccess}>
          <MessageBarBody>
            <MessageBarTitle>Link copied to clipboard</MessageBarTitle>
          </MessageBarBody>
        </MessageBar>
      )}

      {invites.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400}>No invite links yet</Text>
          <Text
            as="p"
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            Generate an invite link to share with end users
          </Text>
        </div>
      ) : (
        <Table aria-label="Invite links">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Label</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Link</TableHeaderCell>
              <TableHeaderCell>Uses</TableHeaderCell>
              <TableHeaderCell>Expires</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>
                  <Text>{invite.label || "Untitled"}</Text>
                </TableCell>
                <TableCell>{statusBadge(invite.status)}</TableCell>
                <TableCell>
                  <div className={styles.tokenCell}>
                    <Text className={styles.tokenText}>
                      {invite.invite_url}
                    </Text>
                    <Tooltip
                      content={copiedId === invite.id ? "Copied!" : "Copy link"}
                      relationship="label"
                    >
                      <Button
                        appearance="subtle"
                        icon={<Copy24Regular />}
                        size="small"
                        onClick={() => handleCopy(invite)}
                        aria-label="Copy invite link"
                      />
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <Text>
                    {invite.use_count}
                    {invite.max_uses !== null ? ` / ${invite.max_uses}` : ""}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>{formatDate(invite.expires_at)}</Text>
                </TableCell>
                <TableCell>
                  <Text size={200}>{formatDate(invite.created_at)}</Text>
                </TableCell>
                <TableCell>
                  {invite.status === "active" && (
                    <Tooltip content="Revoke this invite link" relationship="label">
                      <Button
                        appearance="subtle"
                        icon={<Dismiss24Regular />}
                        size="small"
                        onClick={() => setRevokeTarget(invite)}
                        aria-label="Revoke invite"
                      />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(_, d) => {
          if (!d.open) setRevokeTarget(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Revoke Invite Link</DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to revoke the invite link
                {revokeTarget?.label ? ` "${revokeTarget.label}"` : ""}? End
                users will no longer be able to use this link to join the
                project. Existing seats are not affected.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setRevokeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleRevoke}
                disabled={isRevoking}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                }}
              >
                {isRevoking ? "Revoking..." : "Revoke"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
