# Changelog

All notable changes to Highway Todo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-23

First public cut of Highway Todo — an Angular todo app whose UX is an aerial
view of a five-lane highway. Every task is a truck driving in the lane that
matches its status.

### Added

- **Five lanes** across the highway: `New` → `In Progress` → `Rejected` →
  `Verified` → `Completed`. Tasks show up as trucks in their current lane.
- **Overhead sign gantry** with a truss-beam graphic and one green sign plate
  per lane. Each plate has a **digital dot-matrix billboard** (real 3×5
  amber-LED glyphs) in the bottom-right showing the live task count for that
  lane.
- **Drag-and-drop between lanes** via Angular CDK. The dragged truck tilts up
  to ±14° in the direction of pointer motion, other lanes wash to a lighter
  grey so the drop target stands out, and dropping updates the task's status.
- **Task modal (Reactive Forms)** to create, edit, or delete tasks:
  - Title auto-focuses on open.
  - Title is required and clamped to 120 chars; error messages are suppressed
    the instant the modal starts closing so they can't flash during teardown.
  - Description is a fixed 200 px non-resizable textarea.
  - Lane can be changed inline (moves the truck without a drag).
  - Traffic-cone orange primary button (WCAG-AA contrast); Cancel and Delete
    keep neutral / red styling.
- **`N` keyboard shortcut** creates a new task from anywhere (ignored when
  typing in a field or when the modal is already open).
- **`Esc`** dismisses the modal only when the title is still empty — keeps you
  from accidentally throwing away in-progress edits.
- **First-task onboarding hint** — an overlay appears once (after your very
  first create) explaining that the page scrolls when a lane has more than
  three trucks.
- **Persistence** to `localStorage` under `highway-todo::tasks`. Reloading
  rehydrates.

### Under the hood

- Angular 19 standalone components, `ChangeDetectionStrategy.OnPush`.
- Signal-based state — `TaskService` holds `signal<Task[]>`, exposing derived
  `tasksByStatus` and `counts`. No NgRx, no BehaviorSubject.
- Every child component is presentational — inputs / outputs only. Only
  `AppComponent` talks to the store.
- CDK drag-drop wired with a custom `*cdkDragPreview` template. The truck tilt
  is driven via a `--drag-tilt` custom property on the preview root so CDK's
  per-frame `transform` writes can't clobber it.
- CSS container queries (`cqi`, `container-type: size`) so signs, billboards,
  and truck labels stay proportional at every viewport width.
- 62-test Karma + Jasmine suite across `TaskService`, `LaneComponent`,
  `TruckComponent`, `TollSensorComponent`, `TaskModalComponent`,
  `AppComponent`, and `DigitalBillboardComponent`.

[Unreleased]: https://github.com/kentzmann/highway-todo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/kentzmann/highway-todo/releases/tag/v0.1.0
