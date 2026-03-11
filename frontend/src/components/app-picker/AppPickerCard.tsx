"use client";

import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  AppsListDetail24Regular,
  Checkmark24Regular,
  Clock24Regular,
  ArrowSync24Regular,
  ErrorCircle24Regular,
  Table24Regular,
  Navigation24Regular,
} from "@fluentui/react-icons";
import type { TrainingTrack, TrainingTrackStatus } from "@/types/trainingTrack";

const useStyles = makeStyles({
  card: {
    width: "100%",
    cursor: "pointer",
    transitionProperty: "box-shadow, border-color, transform",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-in-out",
    ...shorthands.border("2px", "solid", "transparent"),
    "&:hover": {
      boxShadow: tokens.shadow8,
      transform: "translateY(-2px)",
    },
    "&:focus-visible": {
      outlineColor: tokens.colorBrandStroke1,
      outlineWidth: "2px",
      outlineStyle: "solid",
    },
  },
  cardSelected: {
    ...shorthands.border("2px", "solid", tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
  },
  cardDisabled: {
    cursor: "default",
    opacity: 0.7,
    "&:hover": {
      boxShadow: "none",
      transform: "none",
    },
  },
  cardPreview: {
    backgroundColor: tokens.colorNeutralBackground3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "72px",
    position: "relative",
  },
  cardPreviewSelected: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  cardPreviewGenerating: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
  },
  cardPreviewError: {
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  appIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "36px",
    width: "36px",
    height: "36px",
  },
  appIconGenerating: {
    color: tokens.colorPaletteYellowForeground1,
    animationName: {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
  appIconError: {
    color: tokens.colorPaletteRedForeground1,
  },
  selectedBadge: {
    position: "absolute",
    top: tokens.spacingVerticalXS,
    right: tokens.spacingHorizontalXS,
  },
  statusBadge: {
    position: "absolute",
    top: tokens.spacingVerticalXS,
    left: tokens.spacingHorizontalXS,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "2.4em",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3,
  },
  metaIcon: {
    fontSize: "16px",
    width: "16px",
    height: "16px",
  },
  generatedAt: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground4,
  },
});

interface AppPickerCardProps {
  track: TrainingTrack;
  isSelected: boolean;
  onSelect: (appUniqueName: string) => void;
}

const STATUS_CONFIG: Record<
  TrainingTrackStatus,
  { label: string; color: "success" | "warning" | "danger" | "informative" }
> = {
  ready: { label: "Ready", color: "success" },
  generating: { label: "Generating...", color: "warning" },
  pending: { label: "Pending", color: "informative" },
  error: { label: "Error", color: "danger" },
};

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function AppPickerCard({
  track,
  isSelected,
  onSelect,
}: AppPickerCardProps) {
  const styles = useStyles();
  const statusConfig = STATUS_CONFIG[track.status];
  const isClickable = track.status !== "generating";

  const handleClick = () => {
    if (isClickable) {
      onSelect(track.app_unique_name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && isClickable) {
      e.preventDefault();
      onSelect(track.app_unique_name);
    }
  };

  return (
    <Card
      className={mergeClasses(
        styles.card,
        isSelected && styles.cardSelected,
        !isClickable && styles.cardDisabled
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="option"
      aria-selected={isSelected}
      aria-disabled={!isClickable}
      tabIndex={0}
    >
      <CardPreview
        className={mergeClasses(
          styles.cardPreview,
          isSelected && styles.cardPreviewSelected,
          track.status === "generating" && styles.cardPreviewGenerating,
          track.status === "error" && styles.cardPreviewError
        )}
      >
        {track.status === "generating" ? (
          <ArrowSync24Regular
            className={mergeClasses(styles.appIcon, styles.appIconGenerating)}
          />
        ) : track.status === "error" ? (
          <ErrorCircle24Regular
            className={mergeClasses(styles.appIcon, styles.appIconError)}
          />
        ) : (
          <AppsListDetail24Regular className={styles.appIcon} />
        )}

        {/* Selected indicator */}
        {isSelected && (
          <Badge
            appearance="filled"
            color="brand"
            className={styles.selectedBadge}
            icon={<Checkmark24Regular />}
            size="small"
          >
            Active
          </Badge>
        )}

        {/* Status badge */}
        {track.status !== "ready" && (
          <Tooltip content={track.error_message || statusConfig.label} relationship="label">
            <Badge
              appearance="tint"
              color={statusConfig.color}
              className={styles.statusBadge}
              size="small"
            >
              {statusConfig.label}
            </Badge>
          </Tooltip>
        )}
      </CardPreview>

      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            {track.display_name || track.app_unique_name}
          </Text>
        }
        description={
          <Text className={styles.description} size={200}>
            {track.description || "Training walkthrough for this application."}
          </Text>
        }
      />

      {/* Metadata row: entities and sitemap areas */}
      <div className={styles.metaRow}>
        <Tooltip content="Number of tables" relationship="label">
          <div className={styles.metaItem}>
            <Table24Regular className={styles.metaIcon} />
            <Text size={200}>
              {track.entity_count} {track.entity_count === 1 ? "table" : "tables"}
            </Text>
          </div>
        </Tooltip>
        {track.sitemap_area_count > 0 && (
          <Tooltip content="Number of sitemap areas" relationship="label">
            <div className={styles.metaItem}>
              <Navigation24Regular className={styles.metaIcon} />
              <Text size={200}>
                {track.sitemap_area_count}{" "}
                {track.sitemap_area_count === 1 ? "area" : "areas"}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Last generated timestamp */}
      {track.last_generated_at && (
        <Tooltip
          content={new Date(track.last_generated_at).toLocaleString()}
          relationship="label"
        >
          <div className={styles.generatedAt}>
            <Clock24Regular className={styles.metaIcon} />
            <Text size={100}>
              Generated {formatRelativeTime(track.last_generated_at)}
            </Text>
          </div>
        </Tooltip>
      )}
    </Card>
  );
}
