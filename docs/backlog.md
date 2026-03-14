# Atlas Backlog

> Deferred ideas, nice-to-haves, and future iteration candidates.
> Populated automatically by the `ux-ui` and `training-expert` agents during
> feature development. Nothing here is forgotten — it's waiting for the right moment.

**How to use this:**
- Review before planning a new sprint or feature iteration
- Items marked `[UX]` came from design reviews; `[Training]` from adoption reviews
- Promote an item to active development by running `/feature <item description>`

---

## UX & Interface

<!-- ux-ui agent appends here -->

| # | Item | Context | Feature | Added |
|---|------|---------|---------|-------|
| 1 | Dark mode support via FluentProvider theme toggle | Only webLightTheme is used; dark mode is not supported | Global | 2026-03-14 |
| 2 | Responsive breakpoints for mobile/tablet layouts | All layouts use fixed widths and desktop-only assumptions | Global | 2026-03-14 |
| 3 | Focus trap for CoachMarkOverlay dialog | Overlay uses role="dialog" but does not trap focus within the callout | Walkthrough | 2026-03-14 |
| 4 | Keyboard-accessible drag reorder via live region announcements | Step and workflow reorder cards announce via drag events only, no ARIA live updates | Step Editor | 2026-03-14 |
| 5 | Skip-to-content link for keyboard users | No skip navigation link exists in the root layout | Global | 2026-03-14 |
| 6 | Animated transitions between walkthrough steps | Step transitions are instant; entrance/exit animations are not implemented | Walkthrough | 2026-03-14 |
| 7 | Toast/notification system for transient feedback | Currently uses MessageBar for all feedback; some operations (save, copy link) would benefit from transient toast | Global | 2026-03-14 |
| 8 | Consolidate duplicate CoachMark implementations into single component | walkthrough/CoachMark.tsx and coach-mark/CoachMark.tsx serve overlapping purposes | Walkthrough | 2026-03-14 |

---

## Training & Adoption

<!-- training-expert agent appends here -->

| # | Item | Context | Feature | Added |
|---|------|---------|---------|-------|
| — | *No items yet* | — | — | — |
