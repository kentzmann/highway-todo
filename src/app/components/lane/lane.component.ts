import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  NgZone,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  CdkDragDrop,
  CdkDragMove,
  CdkDropList,
  CdkDrag,
} from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../models/task.model';
import { TruckComponent } from '../truck/truck.component';

const DRAG_TILT_DEG = 14;

@Component({
  selector: 'app-lane',
  standalone: true,
  imports: [CdkDropList, CdkDrag, TruckComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.scss',
})
export class LaneComponent {
  @Input({ required: true }) status!: TaskStatus;
  @Input({ required: true }) tasks: Task[] = [];
  @Input({ required: true }) connectedLaneIds: string[] = [];
  @Input() isCreateLane = false;

  @Output() readonly taskDropped = new EventEmitter<{
    taskId: string;
    status: TaskStatus;
  }>();
  @Output() readonly taskOpened = new EventEmitter<Task>();
  @Output() readonly laneClicked = new EventEmitter<TaskStatus>();

  /** Live rotation applied to the drag preview so the truck appears
   * to turn toward the direction the user is dragging. Reset on drag
   * start/end. */
  readonly dragTilt = signal(0);

  private readonly zone = inject(NgZone);
  private lastPointerX = 0;

  get dropListId(): string {
    return `lane-${this.status.replace(/\s+/g, '-')}`;
  }

  onDragStarted(event: CdkDragMove<Task> | { source?: unknown } = {}): void {
    this.setTilt(0);
    this.lastPointerX = 0;
    document.body.classList.add('is-drag-active');
  }

  onDragMoved(event: CdkDragMove<Task>): void {
    // Prefer real pointer-position deltas over `event.delta.x` (which
    // collapses to -1/0/1 and misses purely-horizontal movements that
    // happen to land between two frames as "0"). A 2 px hysteresis
    // avoids flipping the tilt on every micro-jitter.
    const x = event.pointerPosition.x;
    if (this.lastPointerX === 0) {
      this.lastPointerX = x;
      return;
    }
    const dx = x - this.lastPointerX;
    if (Math.abs(dx) < 2) return;
    this.lastPointerX = x;
    const tilt = dx > 0 ? DRAG_TILT_DEG : -DRAG_TILT_DEG;
    if (this.dragTilt() === tilt) return;
    this.setTilt(tilt);
  }

  onDragEnded(): void {
    this.setTilt(0);
    this.lastPointerX = 0;
    document.body.classList.remove('is-drag-active');
  }

  /** Writes `--drag-tilt` on `<body>`. The custom property inherits
   * everywhere in the document — including into the `.cdk-drag-preview`
   * that CDK reparents onto `<body>` — and it lives in a separate
   * inline-style slot from `transform`, so CDK's per-frame `transform`
   * rewrites can't erase it. The truck's rotate is driven purely from
   * that variable in global CSS (see `styles.scss`). The signal is kept
   * in sync solely for test coverage. */
  private setTilt(deg: number): void {
    if (NgZone.isInAngularZone()) {
      this.dragTilt.set(deg);
    } else {
      this.zone.run(() => this.dragTilt.set(deg));
    }
    document.body.style.setProperty('--drag-tilt', `${deg}deg`);
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) return;
    const task = event.item.data as Task;
    this.taskDropped.emit({ taskId: task.id, status: this.status });
  }

  onLaneClick(event: MouseEvent): void {
    if (!this.isCreateLane) return;
    const target = event.target as HTMLElement;
    if (target.closest('.truck')) return;
    this.laneClicked.emit(this.status);
  }

  onTaskOpened(task: Task): void {
    this.taskOpened.emit(task);
  }
}
