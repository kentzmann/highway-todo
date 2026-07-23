# CLAUDE.md — Highway Todo

An Angular todo application with a highway/aerial-view UX metaphor. Built for
an interview exercise, TDD from day one, local-storage only.

**Repo:** `git@github.com:kentzmann/highway-todo.git`. **Version:** 0.1.0 (per
`package.json`).

## The metaphor

- The page is an **aerial view of a 5-lane highway**.
- Lanes left → right: **New → In Progress → Rejected → Verified → Completed**.
- Each **task** is a **truck** (image, `static/assets/truck.png`) driving in
  its lane. The task title is on a white plate glued to the truck bed.
- Above the road, an **overhead truss-beam gantry** (`static/assets/truss-beam.png`)
  holds one **highway sign** (`static/assets/sign.png`) per lane.
- Each sign has a tiny **digital dot-matrix billboard** in the bottom-right
  showing the live task count for that lane — real 3×5 amber-LED glyphs, not
  glowing text.
- The road edges are thin solid **white shoulders**. Lanes are separated by
  dashed **white** skip-lines (MUTCD-style ~60 px paint / 90 px gap
  proportions).
- Bottom-center of the viewport: a chunky **traffic-cone orange** "Create Task"
  button that presses into its housing on click.
- Bottom-right: a small Courier-New credits line with the app version, linked
  to `CHANGELOG.md` on GitHub.

## Interactions

| Action | Result |
| --- | --- |
| Click **Create Task** (bottom-center button) | Opens modal, defaults to `New` lane |
| Press `N` (outside any input, modal closed) | Same as clicking Create Task |
| Click anywhere in the leftmost (`New`) lane background | Opens modal, defaults to `New` |
| Click an existing truck | Opens modal in edit mode |
| Drag a truck | Truck tilts up to ±14° in the direction of horizontal motion; the source lane and all non-hovered lanes wash to a neutral lighter grey; the hovered target reverts to plain asphalt so it stands out |
| Drop a truck into a lane | Task's status switches to that lane (no-op if same lane) |
| `Esc` in an empty title field | Dismisses the modal (won't fire if you've typed anything) |
| First task ever created | Overlay hint tells you the page can scroll up/down — auto-dismisses after 6 s or on click. Stored under `highway-todo::scroll-hint-seen` so it only ever shows once |

Data is persisted to `localStorage` under `highway-todo::tasks`. Reloading
rehydrates.

## Architecture

```
src/app
├── app.component.*                     Orchestrator: gantry + lanes + modal + credits
├── models/task.model.ts                Task type, TASK_STATUSES, TaskStatus
├── services/task.service.ts            Signal-based store + local storage
│   └── task.service.spec.ts            12 unit tests
├── components/
│   ├── toll-sensor/                    Digital-sign header (CURRENTLY DISABLED — kept for reuse)
│   ├── lane/                           A single highway lane + drop target + drag preview
│   ├── truck/                          Individual task truck (image-based)
│   ├── task-modal/                     Create / edit / delete modal (Reactive Forms)
│   └── digital-billboard/              3×5 dot-matrix LED count display
```

`TollSensorComponent` is fully implemented and tested, but the parent element
and its import are commented out in `AppComponent`. Look for
`Banner kept for later reuse.` in `app.component.html` / `.ts` to re-enable.

### State

`TaskService` is a `providedIn: 'root'` singleton backed by an Angular
`signal<Task[]>`. Derived signals (`tasksByStatus`, `counts`) drive the UI.
Any mutation (`create`/`update`/`moveTo`/`delete`) synchronously writes the
full task list back to `localStorage`. Reads on startup tolerate missing or
malformed payloads and fall back to an empty list.

### Drag & drop

Uses `@angular/cdk/drag-drop`.

- Each lane exposes a `cdkDropList` with an id derived from its status
  (`lane-New`, `lane-In-Progress`, …). Every lane is connected to every other
  via `cdkDropListConnectedTo`, so a truck can be dropped in any lane.
- On drop, the lane emits `{ taskId, status }` upward; the root component
  calls `TaskService.moveTo(...)`, which is a no-op if the status is unchanged.
- The **truck-tilt-on-drag** is the tricky bit. See the long comment on
  `LaneComponent.setTilt(...)`: `*cdkDragPreview` creates an embedded view,
  CDK detaches it from Angular's view container, reparents it under `<body>`,
  and rewrites its inline `transform` every pointer frame for positioning.
  Angular's change detection doesn't reliably re-check the detached view.
  Solution: write a `--drag-tilt` custom property on `<body>` — it lives in a
  separate inline-style slot from `transform`, cascades into the preview, and
  gets applied via `.cdk-drag-preview app-truck .truck { transform: rotate(var(--drag-tilt)) }`
  in global CSS (`styles.scss`). The signal is kept in sync for test coverage,
  but the visual updates go through the CSS variable path.
- The **"dim other lanes" behavior** is toggled by a plain `.is-drag-active`
  class on `<body>` (added in `cdkDragStarted`, removed in `cdkDragEnded`).
  Global CSS: `body.is-drag-active .drop-zone { background: #6b6b6b !important }`
  with the `.cdk-drop-list-receiving` override reverting to transparent.
- **Shoulders** and the vertical scrollbar area become transparent during a
  drag so nothing white sticks out on the road edges.

### Sizing (container queries everywhere)

Every visual whose size should track its parent uses `container-type: inline-size`
(or `size` where both dims matter) and expresses internal sizing in `cqi`. So:

- `TruckComponent` — cargo label font-size is `12cqi` of the truck's width.
- `SignPlate` in the gantry — text is `11cqi` of the plate.
- `DigitalBillboardComponent` — every dot (13 cqi), gap (2–4 cqi), padding
  (3 cqi), border-radius, and glow blur are all in `cqi` so the dot matrix
  stays proportional no matter the viewport.

### Modal (Reactive Forms)

`TaskModalComponent`:

- Typed `FormGroup<TaskForm>` from `FormBuilder.nonNullable.group`.
- `Validators.required` + `Validators.maxLength(120)` on the title.
- On open: `ngAfterViewInit` (via `@ViewChild('titleInput')` + `queueMicrotask`)
  auto-focuses the title so you can just start typing.
- `Esc` dismisses only if the title is empty — protects mid-edit typing.
- **`isClosing` signal** guards every `.field-error` block. All exit paths
  (`submit()`, `dismiss()`, `requestDelete()`, backdrop click, Esc, close-X)
  flip it to `true` before emitting, so the moment CD paints the final tick
  before the parent's `@if` destroys the modal, no "Title is required" error
  flashes for one frame. This was a real bug — see commit / spec history.
- Textarea is a fixed 200 px, `resize: none`.
- Primary button is traffic-cone orange (WCAG-AA `~6.2:1` on dark text).

### Digital billboard (dot matrix)

`DigitalBillboardComponent`:

- `@Input({ required: true }) value: number` — the count.
- `DIGIT_PATTERNS: Record<string, readonly string[]>` — hand-crafted 3-wide ×
  5-tall glyphs for `'0'`–`'9'` as `'1'`/`'0'` strings.
- Renders one `.digit` per digit (via `String(Math.max(0, Math.floor(value))).split('')`),
  then a `@for` over rows and cols emits real `<span class="dot">` elements
  with `.dot--on` when the pattern position is `'1'`.
- `container-type: size` on `.billboard` — everything inside is in `cqi`.
- Fit math (in the SCSS comment): dot 13, gaps 2 / 4, padding 3, so 2 digits =
  90 cqi wide (fits in 94 cqi content box). 1 digit centers naturally.
- Off dots: `rgba(255, 179, 71, 0.24)` fill + tiny amber halo. On dots:
  `#ffbb55` + two-layer amber bloom.

### Data binding & forms

- **Property binding** (`[status]`, `[tasks]`, `[counts]`, `[disabled]`,
  `[style.background]`, `[attr.data-status]`, …) flows data down.
- **Event binding** (`(click)`, `(keydown)`, `(cdkDropListDropped)`,
  `(ngSubmit)`, `(saved)`, `(deleted)`, …) flows intent up.
- Only the smart container (`AppComponent`) talks to `TaskService`. Every
  child component is presentational — inputs / outputs only — trivially
  testable in isolation.

### Components are OnPush

All components use `ChangeDetectionStrategy.OnPush` and read from signals,
which participate in change detection automatically.

### Component reuse contract

| Component | `@Input` | `@Output` |
| --- | --- | --- |
| `TollSensorComponent` (disabled) | `statuses`, `counts` | — |
| `TruckComponent` | `task` | `opened` |
| `LaneComponent` | `status`, `tasks`, `connectedLaneIds`, `isCreateLane` | `taskDropped`, `taskOpened`, `laneClicked` |
| `TaskModalComponent` | `task`, `defaultStatus` | `saved`, `deleted`, `dismissed` |
| `DigitalBillboardComponent` | `value` | — |

## TDD

Test files sit next to the source they cover (`*.spec.ts`). **62 tests, all
passing** as of writing:

| Suite | Tests | Focus |
| --- | --- | --- |
| `TaskService` | 12 | Storage round-trip, CRUD, grouping, counts |
| `TollSensorComponent` | 2 | Renders one cell per status, echoes `@Input` |
| `TruckComponent` | 3 | Renders title, emits `opened` on click / Enter |
| `LaneComponent` | 10 | Data-status attribute, truck list, drag tilt (right/left/hold/reset), create-lane click, `taskOpened` bubbling |
| `TaskModalComponent` | 10 | Reactive form validation, autofocus, Esc-when-empty, backdrop dismiss, emissions |
| `AppComponent` | 19 | Lane wiring, `N` hotkey (5 tests), scroll hint (5 tests), gantry sign plates, create/edit/delete flow |
| `DigitalBillboardComponent` | 6 | Digit count, lit-dot count for known glyphs, negative/float clamp |

Run:

```bash
npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox
```

`karma.conf.js` includes a `ChromeHeadlessNoSandbox` custom launcher for CI.

## Running

```bash
npm install
npm start          # dev server at http://localhost:4200
npm test           # karma / jasmine, watch mode
npm run build      # production build
```

## Release process

`CHANGELOG.md` follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
and the project follows [SemVer](https://semver.org/):

- Bug fix → patch (`0.1.0 → 0.1.1`)
- New feature, backwards-compatible → minor (`0.1.0 → 0.2.0`)
- Breaking change → major (`0.1.0 → 1.0.0`)

**While working:** every user-visible change lands as a bullet under
`## [Unreleased]` in `CHANGELOG.md`, grouped by `Added` / `Changed` /
`Deprecated` / `Removed` / `Fixed` / `Security`.

**When cutting a release**, in a single "release vX.Y.Z" commit:

1. Bump `version` in `package.json` (this is what the bottom-right credits
   line renders — the app is the source of truth).
2. In `CHANGELOG.md`:
   - Rename `## [Unreleased]` → `## [X.Y.Z] - YYYY-MM-DD` (ISO date, today).
   - Insert a fresh empty `## [Unreleased]` above it.
   - Update the compare-link footer:
     ```
     [Unreleased]: https://github.com/kentzmann/highway-todo/compare/vX.Y.Z...HEAD
     [X.Y.Z]: https://github.com/kentzmann/highway-todo/compare/vPREV...vX.Y.Z
     ```
3. Commit, then tag and push:
   ```bash
   git tag vX.Y.Z
   git push && git push --tags
   ```

The compare link only resolves once the tag is pushed. GitHub Releases are
optional but recommended — cut one from the tag if you want release notes to
show up in the repo sidebar.

## Things I would do next (my words not AI)

- Create a SDD folder in /specs (to fully describe the features and fixes in Plan mode)
- Add an auth layer
- Create a Node.js backend repo for CRUD actions
- Create a Supabase project with these tables:

  - Accounts
  - Tasks
- Create APIs to update Tasks using REST

  - Write test cases first
- Remove local storage functionality
- Wire-up this front-end to use APIs

  - Write new test cases first

## File map for the reviewer

- **`src/app/models/task.model.ts`** — data model and the frozen 5-status list.
- **`src/app/services/task.service.ts`** — the whole store; read this first.
- **`src/app/app.component.ts`** — how the pieces are wired together.
- **`src/app/components/lane/lane.component.ts`** — where drag-drop plugs in;
  see `setTilt` for the CDK preview + custom-property workaround.
- **`src/app/components/digital-billboard/digital-billboard.component.ts`** —
  hand-drawn 3×5 dot-matrix digits.
- **`src/app/components/task-modal/task-modal.component.ts`** — Reactive Forms
  + `isClosing` flag preventing error flash on dismiss.
- **`src/styles.scss`** — global styles for CDK drag preview, drag-active lane
  wash, transparent scrollbar-gutter.
- **`karma.conf.js`** — headless Chrome launcher.
- **`CHANGELOG.md`** — Keep a Changelog format; linked from the in-app credits line.
