# Agent Note: Filter field in the composer model menu

Status: implemented

English | [中文](2026-08-31-model-menu-search.zh.md)

## Problem

Provider catalogs have grown past what a plain scrollable list serves: a single provider can advertise dozens of models, and the composer model menu (ModelSelect's Model pane) listed every row of every group, so reaching a specific model meant scrolling and eye-scanning the whole directory.

## Decision

The Model pane carries a filter input above the provider-grouped list. The query narrows rows by a case-insensitive substring of each model's name or id, drops groups emptied by the filter, and shows a filter-specific empty state (`empty.search`) when nothing matches — distinct from the catalog-empty state (`empty.models`), which still reports a directory with no rows at all. Enter selects the first visible row; arrow keys fall through to the menu's existing root handler and move focus into the filtered list. The query resets each time the menu opens so a stale filter never hides rows in a later visit.

Filtering is presentation-only: it reads the same `state.groups` the unfiltered list renders, so selection, grouping, and failure rows are untouched, and the `/model` popupSelect entry is unchanged.

## Alternatives considered

**Search in the shared popupSelect primitive.** Rejected as a separate change: the pictured surface is the composer menu, and the `/model` entry has its own option list owned by the command-ui primitive; widening that primitive's contract for one consumer is not justified by this need.

**Provider-aware or fuzzy matching.** Rejected: substring over name and id covers the real lookups (a remembered fragment of either), and a scorer would add ranking decisions with no evidence users need them.

## Testing

A render test pins id-substring matching (uppercase query against a lowercase id), the emptied group dropping its heading, the no-match empty copy, and Enter selecting the first visible row through the real `select` path.

## Consequences

Long provider catalogs are navigable by typing a fragment of the model's name or id. The cost is three locale keys and a small derived-list computation in ModelSelect, kept beside the list it filters.
