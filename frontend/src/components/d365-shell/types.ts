/**
 * Types for the D365 chrome shell renderer.
 *
 * These types define the data structures consumed by the shell components
 * to render a high-fidelity Dynamics 365 model-driven app layout.
 */

/** A single sitemap navigation item (entity link in the left nav). */
export interface SitemapItem {
  entity_logical_name: string;
  display_name: string;
  position: number;
  has_main_form: boolean;
  has_views: boolean;
}

/** A group of sitemap items within an area. */
export interface SitemapGroup {
  id: string;
  title: string;
  items: SitemapItem[];
}

/** A top-level sitemap area containing groups. */
export interface SitemapAreaDef {
  id: string;
  title: string;
  groups: SitemapGroup[];
}

/** The complete sitemap structure from the UX Expert agent. */
export interface SitemapStructure {
  areas: SitemapAreaDef[];
}

/** Command bar action definitions per entity. */
export type CommandBarActions = Record<string, string[]>;
