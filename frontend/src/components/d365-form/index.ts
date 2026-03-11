/**
 * D365 Form Renderer — barrel exports.
 *
 * These components collectively render a high-fidelity Dynamics 365
 * model-driven app form for walkthroughs. The main entry point is
 * D365FormRenderer, which orchestrates the header, command bar, tabs,
 * sections, and fields.
 */

export { D365FormRenderer } from "./D365FormRenderer";
export type { D365FormRendererProps } from "./D365FormRenderer";

export { D365CommandBar } from "./D365CommandBar";
export type { D365CommandBarProps } from "./D365CommandBar";

export { D365FormHeader } from "./D365FormHeader";
export type { D365FormHeaderProps } from "./D365FormHeader";

export { D365FormTabs } from "./D365FormTabs";
export type { D365FormTabsProps, TabItem } from "./D365FormTabs";

export { D365FormSection } from "./D365FormSection";
export type { D365FormSectionProps } from "./D365FormSection";

export { D365FormField } from "./D365FormField";
export type { D365FormFieldProps } from "./D365FormField";

export { QuickCreateForm } from "./QuickCreateForm";
export type { QuickCreateFormProps } from "./QuickCreateForm";

export { MarkdownFieldAnnotation } from "./MarkdownFieldAnnotation";
export type { MarkdownFieldAnnotationProps } from "./MarkdownFieldAnnotation";

export { D365FormWithShell } from "./D365FormWithShell";
export type { D365FormWithShellProps } from "./D365FormWithShell";
