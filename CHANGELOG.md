# Changelog

All notable changes to this project are documented in this file.

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
