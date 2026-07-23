import { TestBed } from '@angular/core/testing';
import { LaneComponent } from './lane.component';
import { Task, TaskStatus } from '../../models/task.model';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Task',
    status: 'New',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('LaneComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [LaneComponent] }),
  );

  function mount(inputs: {
    status: TaskStatus;
    tasks: Task[];
    connected?: string[];
    isCreateLane?: boolean;
  }) {
    const fixture = TestBed.createComponent(LaneComponent);
    fixture.componentRef.setInput('status', inputs.status);
    fixture.componentRef.setInput('tasks', inputs.tasks);
    fixture.componentRef.setInput('connectedLaneIds', inputs.connected ?? []);
    fixture.componentRef.setInput('isCreateLane', inputs.isCreateLane ?? false);
    fixture.detectChanges();
    return fixture;
  }

  it('exposes the status via data-status for downstream styling', () => {
    const fixture = mount({ status: 'In Progress', tasks: [] });
    const lane = fixture.nativeElement.querySelector('.lane');
    expect(lane.getAttribute('data-status')).toBe('In Progress');
  });

  it('renders one truck per task', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'a' }), makeTask({ id: 'b' })],
    });
    expect(fixture.nativeElement.querySelectorAll('app-truck').length).toBe(2);
  });

  it('emits laneClicked when the create lane background is clicked', () => {
    const fixture = mount({ status: 'New', tasks: [], isCreateLane: true });
    let emitted: TaskStatus | undefined;
    fixture.componentInstance.laneClicked.subscribe(
      (s) => (emitted = s),
    );
    fixture.nativeElement.querySelector('.lane').click();
    expect(emitted).toBe('New');
  });

  it('does not emit laneClicked for non-create lanes', () => {
    const fixture = mount({ status: 'Verified', tasks: [] });
    let emitted = false;
    fixture.componentInstance.laneClicked.subscribe(() => (emitted = true));
    fixture.nativeElement.querySelector('.lane').click();
    expect(emitted).toBeFalse();
  });

  function moveTo(fixture: any, x: number): void {
    fixture.componentInstance.onDragMoved({
      pointerPosition: { x, y: 0 },
    } as any);
  }

  it('tilts the drag preview right when the pointer moves right', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'x' })],
    });
    moveTo(fixture, 100); // seed the previous position
    moveTo(fixture, 150);
    expect(fixture.componentInstance.dragTilt()).toBeGreaterThan(0);
  });

  it('tilts the drag preview left when the pointer moves left', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'x' })],
    });
    moveTo(fixture, 200);
    moveTo(fixture, 100);
    expect(fixture.componentInstance.dragTilt()).toBeLessThan(0);
  });

  it('holds the last tilt direction when the pointer stops moving', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'x' })],
    });
    moveTo(fixture, 100);
    moveTo(fixture, 150);
    const tiltAfterRight = fixture.componentInstance.dragTilt();
    moveTo(fixture, 150);
    expect(fixture.componentInstance.dragTilt()).toBe(tiltAfterRight);
  });

  it('resets tilt on drag start and drag end', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'x' })],
    });
    moveTo(fixture, 100);
    moveTo(fixture, 200);
    expect(fixture.componentInstance.dragTilt()).not.toBe(0);
    fixture.componentInstance.onDragEnded();
    expect(fixture.componentInstance.dragTilt()).toBe(0);
    fixture.componentInstance.onDragStarted();
    expect(fixture.componentInstance.dragTilt()).toBe(0);
  });

  it('bubbles taskOpened events from child trucks', () => {
    const fixture = mount({
      status: 'New',
      tasks: [makeTask({ id: 'x', title: 'Open me' })],
    });
    let emitted: Task | undefined;
    fixture.componentInstance.taskOpened.subscribe((t) => (emitted = t));
    fixture.nativeElement.querySelector('.truck').click();
    expect(emitted?.id).toBe('x');
  });
});
