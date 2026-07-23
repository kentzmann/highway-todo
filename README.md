# Highway Todo

A todo app whose UI is an aerial view of a 5-lane highway. Each task is a
truck driving in the lane that matches its status.

Statuses (left → right):

1. New
2. In Progress
3. Rejected
4. Verified
5. Completed

## Quick start

```bash
npm install
npm start                    # http://localhost:4200
npm test -- --watch=false --browsers=ChromeHeadlessNoSandbox
npm run build
```

## What to know

- **Angular 19**, standalone components, signals.
- **`@angular/cdk`** drag-and-drop between lanes.
- **`localStorage`** persistence (key: `highway-todo::tasks`).
- **TDD**: 38 tests across service and component specs.
- See [`CLAUDE.md`](./CLAUDE.md) for design notes.

## Interactions

- **Create Task** button, or click anywhere in the leftmost lane,
  opens a create-task modal.
- Click a truck to edit or delete it.
- Drag trucks between lanes to change status. The hovered lane highlights.
- The header **toll gantry** shows a live per-lane task count.
