"use client";

/**
 * MarkdownFieldAnnotation — Renders Markdown annotation text below a form field.
 *
 * Used inside the D365FormField and D365FormSection components to display
 * walkthrough step annotations as rendered Markdown. Annotations come from
 * the Training Expert agent and contain instructional prose, inline code,
 * bold/italic text, links, and lists.
 *
 * The component is compact and fits within the field's visual space without
 * disrupting the form layout.
 */

import { makeStyles, tokens } from "@fluentui/react-components";
import ReactMarkdown from "react-markdown";

// ── Styles ────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    fontSize: tokens.fontSizeBase200,
    lineHeight: "1.5",
    color: tokens.colorNeutralForeground3,
    padding: "4px 8px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    marginTop: "4px",
    "& p": {
      marginTop: 0,
      marginBottom: "4px",
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& strong": {
      fontWeight: tokens.fontWeightBold,
      color: tokens.colorNeutralForeground2,
    },
    "& em": {
      fontStyle: "italic",
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground5,
      padding: "1px 3px",
      borderRadius: tokens.borderRadiusSmall,
      fontSize: tokens.fontSizeBase100,
      fontFamily: "Consolas, 'Courier New', monospace",
    },
    "& ul, & ol": {
      paddingLeft: "16px",
      marginTop: "2px",
      marginBottom: "2px",
    },
    "& li": {
      marginBottom: "1px",
    },
    "& a": {
      color: tokens.colorBrandForeground1,
      textDecoration: "underline",
    },
    "& blockquote": {
      borderLeft: `2px solid ${tokens.colorNeutralStroke2}`,
      paddingLeft: "8px",
      marginLeft: 0,
      marginRight: 0,
      color: tokens.colorNeutralForeground4,
      fontStyle: "italic",
    },
  },
});

// ── Component ─────────────────────────────────────────────────────────

export interface MarkdownFieldAnnotationProps {
  /** Markdown text to render */
  content: string;
  /** Optional CSS class name */
  className?: string;
}

export function MarkdownFieldAnnotation({
  content,
  className,
}: MarkdownFieldAnnotationProps) {
  const styles = useStyles();

  if (!content || content.trim().length === 0) {
    return null;
  }

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
