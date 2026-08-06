# Changelog

All notable changes to this project are documented in this file.

## [0.3.5] - 2026-08-06

### Added
- Added keyboard interaction support in the demo for selecting, moving, and resizing widgets.
- Added accessibility semantics for interactive widget controls, including focusable cards and labeled resize controls.
- Added tests for restore-layout resilience with malformed and partially valid persisted payloads.

### Changed
- Changed layout restore behavior to validate persisted payloads and keep previous layout if restore data is invalid.
- Optimized demo interaction performance by reducing drag/resize hot-path scans and updating swap indicators differentially.
- Optimized demo event handling by using delegated board listeners instead of rebinding per-widget listeners on each render.
- Fixed resize pointer-cancel cleanup to remove blocked-state styling consistently.

## [0.3.4] - 2026-08-06

### Added
- Added realistic demo content for KPI, graph, and list widgets.
- Added expanded README API coverage for dashboard operations, interaction patterns, responsive layouts, and resize-size constraints.

### Changed
- Changed demo visual theme from wood-toned background to a modern cool-toned gradient style.
- Removed Hero widget from demo templates, seed layout, and related styles.
- Updated README demo media reference to the current GIF asset.

## [0.3.3] - 2026-08-06

### Added
- Added resize-overlap blocking in the demo with invalid-state red feedback during preview.
- Added a dedicated blocked resize visual state for the source card and resize preview.

### Changed
- Improved demo drag behavior with a persistent ghost origin style while dragging.
- Reduced unnecessary drag-time UI updates by throttling pointer move rendering with `requestAnimationFrame` and skipping unchanged hover state updates.

## [0.3.2] - 2026-08-04

### Added
- Added this `CHANGELOG.md` to track release history.

## [0.3.1] - 2026-08-04

### Added
- Added dashboard swap toggle support with `swapEnabled` option (default on).
- Added runtime methods to control swap behavior: `setSwapEnabled` and `isSwapEnabled`.
- Added tests covering default-on behavior and opt-out swap behavior.
- Updated documentation to describe swap toggling.

## [0.3.0] - 2026-08-04

### Added
- Added same-size widget swap behavior during drag overlaps.
- Added hover compatibility feedback in demo:
  - Green outline for valid swap candidates.
  - Red outline for incompatible overlap targets.
- Added swap-ready cursor feedback while dragging.
- Added transparent centered swap icon overlay on valid swap targets.
- Added pulse animation for valid swap targets, including reduced-motion fallback.
- Added tests for swap behavior and incompatible collision fallback.

## [0.2.0] - Initial release

### Added
- Initial framework-agnostic TypeScript dashboard layout engine.
- Grid layout, drag/move, resize, collision resolution, templates, plugins, and layout persistence.
- Responsive dimensions API and demo consumer app.
