"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableCellLayout,
  Badge,
  Text,
  Input,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Search24Regular,
  LockClosed16Regular,
  Star16Filled,
} from "@fluentui/react-icons";
import type { FieldDescription } from "@/types/entity";

const useStyles = makeStyles({
  container: {
    marginBottom: tokens.spacingVerticalL,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalM,
    flexWrap: "wrap",
    gap: tokens.spacingVerticalS,
  },
  searchInput: {
    minWidth: "240px",
  },
  table: {
    width: "100%",
  },
  fieldNameCell: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  logicalName: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontFamily: "monospace",
  },
  descriptionCell: {
    maxWidth: "300px",
    color: tokens.colorNeutralForeground2,
  },
  typeBadge: {
    fontSize: tokens.fontSizeBase100,
  },
  requiredIcon: {
    color: tokens.colorPaletteRedForeground1,
    verticalAlign: "middle",
  },
  primaryIcon: {
    color: tokens.colorPaletteMarigoldForeground1,
    verticalAlign: "middle",
  },
  optionsChip: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  lookupTargets: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
});

/** Map field type strings to badge colors. */
function getTypeBadgeColor(fieldType: string): "brand" | "informative" | "success" | "warning" | "subtle" {
  switch (fieldType) {
    case "String":
    case "Memo":
      return "informative";
    case "Integer":
    case "Decimal":
    case "Float":
    case "Money":
    case "BigInt":
      return "success";
    case "Boolean":
      return "warning";
    case "Lookup":
    case "Customer":
    case "Owner":
      return "brand";
    case "Picklist":
    case "MultiSelectPicklist":
    case "State":
    case "Status":
      return "warning";
    default:
      return "subtle";
  }
}

interface FieldDescriptionsTableProps {
  fields: FieldDescription[];
}

export function FieldDescriptionsTable({ fields }: FieldDescriptionsTableProps) {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fields;
    const q = searchQuery.toLowerCase();
    return fields.filter(
      (f) =>
        f.display_name.toLowerCase().includes(q) ||
        f.logical_name.toLowerCase().includes(q) ||
        f.field_type.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [fields, searchQuery]);

  // Sort: primary name first, then required, then alphabetical
  const sortedFields = useMemo(() => {
    return [...filteredFields].sort((a, b) => {
      if (a.is_primary_name !== b.is_primary_name) return a.is_primary_name ? -1 : 1;
      if (a.is_required !== b.is_required) return a.is_required ? -1 : 1;
      return (a.display_name || a.logical_name).localeCompare(
        b.display_name || b.logical_name
      );
    });
  }, [filteredFields]);

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <Text size={500} weight="semibold">
          Fields ({fields.length})
        </Text>
        <Input
          className={styles.searchInput}
          contentBefore={<Search24Regular />}
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
          size="small"
        />
      </div>

      {sortedFields.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>
            {fields.length === 0
              ? "No fields found for this entity."
              : "No fields match your search."}
          </Text>
        </div>
      ) : (
        <Table className={styles.table} size="small" aria-label="Field descriptions">
          <TableHeader>
            <TableRow>
              <TableHeaderCell style={{ minWidth: 180 }}>Field Name</TableHeaderCell>
              <TableHeaderCell style={{ minWidth: 100 }}>Type</TableHeaderCell>
              <TableHeaderCell style={{ minWidth: 60 }}>Required</TableHeaderCell>
              <TableHeaderCell style={{ minWidth: 200 }}>Description</TableHeaderCell>
              <TableHeaderCell style={{ minWidth: 80 }}>Details</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFields.map((field) => (
              <TableRow key={field.logical_name}>
                <TableCell>
                  <TableCellLayout>
                    <div className={styles.fieldNameCell}>
                      <Text size={300} weight="regular">
                        {field.is_primary_name && (
                          <Tooltip content="Primary name field" relationship="label">
                            <Star16Filled className={styles.primaryIcon} />
                          </Tooltip>
                        )}{" "}
                        {field.display_name || field.logical_name}
                      </Text>
                      <Text className={styles.logicalName}>
                        {field.logical_name}
                      </Text>
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="tint"
                    color={getTypeBadgeColor(field.field_type)}
                    size="small"
                    className={styles.typeBadge}
                  >
                    {field.field_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {field.is_required && (
                    <Tooltip content="Required field" relationship="label">
                      <LockClosed16Regular className={styles.requiredIcon} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <Text size={200} className={styles.descriptionCell}>
                    {field.description || "—"}
                  </Text>
                </TableCell>
                <TableCell>
                  {/* Picklist options count */}
                  {field.options.length > 0 && (
                    <Tooltip
                      content={field.options.map((o) => o.label).join(", ")}
                      relationship="description"
                    >
                      <Text className={styles.optionsChip}>
                        {field.options.length} option{field.options.length !== 1 ? "s" : ""}
                      </Text>
                    </Tooltip>
                  )}
                  {/* Lookup targets */}
                  {field.target_entities.length > 0 && (
                    <Text className={styles.lookupTargets}>
                      {field.target_entities.join(", ")}
                    </Text>
                  )}
                  {/* Max length */}
                  {field.max_length != null && field.max_length > 0 && (
                    <Text className={styles.optionsChip}>
                      max {field.max_length}
                    </Text>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
