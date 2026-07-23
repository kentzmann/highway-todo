import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TaskService } from './services/task.service';
import {
  Task,
  TASK_STATUSES,
  TaskStatus,
} from './models/task.model';
// Banner disabled — kept for later reuse.
// import { TollSensorComponent } from './components/toll-sensor/toll-sensor.component';
import { LaneComponent } from './components/lane/lane.component';
import {
  TaskFormValue,
  TaskModalComponent,
} from './components/task-modal/task-modal.component';
import { DigitalBillboardComponent } from './components/digital-billboard/digital-billboard.component';
import packageJson from '../../package.json';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create'; defaultStatus: TaskStatus }
  | { mode: 'edit'; task: Task };

export const SCROLL_HINT_STORAGE_KEY = 'highway-todo::scroll-hint-seen';
const SCROLL_HINT_DURATION_MS = 6000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LaneComponent, TaskModalComponent, DigitalBillboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly svc = inject(TaskService);

  readonly title = 'highway-todo';
  readonly version = packageJson.version;
  readonly releaseNotesUrl = `https://github.com/kentzmann/${packageJson.name}/blob/main/CHANGELOG.md`;
  readonly statuses = TASK_STATUSES;
  readonly tasksByStatus = this.svc.tasksByStatus;
  readonly counts = this.svc.counts;

  readonly modal = signal<ModalState>({ mode: 'closed' });
  readonly showScrollHint = signal(false);
  private scrollHintTimer: ReturnType<typeof setTimeout> | null = null;
  readonly modalTask = computed(() => {
    const m = this.modal();
    return m.mode === 'edit' ? m.task : null;
  });
  readonly modalDefaultStatus = computed(() => {
    const m = this.modal();
    return m.mode === 'create' ? m.defaultStatus : 'New';
  });

  readonly laneIds = this.statuses.map(
    (s) => `lane-${s.replace(/\s+/g, '-')}`,
  );

  connectionsFor(status: TaskStatus): string[] {
    const selfId = `lane-${status.replace(/\s+/g, '-')}`;
    return this.laneIds.filter((id) => id !== selfId);
  }

  openCreate(status: TaskStatus = 'New'): void {
    this.modal.set({ mode: 'create', defaultStatus: status });
  }

  openEdit(task: Task): void {
    this.modal.set({ mode: 'edit', task });
  }

  closeModal(): void {
    this.modal.set({ mode: 'closed' });
  }

  onSaved(value: TaskFormValue): void {
    const state = this.modal();
    const isFirstCreate =
      state.mode === 'create' && this.svc.tasks().length === 0;
    if (state.mode === 'create') {
      this.svc.create({
        title: value.title,
        description: value.description,
        status: value.status,
      });
    } else if (state.mode === 'edit') {
      this.svc.update(state.task.id, {
        title: value.title,
        description: value.description,
        status: value.status,
      });
    }
    this.closeModal();
    if (isFirstCreate && !this.hasSeenScrollHint()) {
      this.markScrollHintSeen();
      this.showScrollHint.set(true);
      this.scrollHintTimer = setTimeout(
        () => this.showScrollHint.set(false),
        SCROLL_HINT_DURATION_MS,
      );
    }
  }

  dismissScrollHint(): void {
    if (this.scrollHintTimer !== null) {
      clearTimeout(this.scrollHintTimer);
      this.scrollHintTimer = null;
    }
    this.showScrollHint.set(false);
  }

  private hasSeenScrollHint(): boolean {
    try {
      return localStorage.getItem(SCROLL_HINT_STORAGE_KEY) === '1';
    } catch {
      return true;
    }
  }

  private markScrollHintSeen(): void {
    try {
      localStorage.setItem(SCROLL_HINT_STORAGE_KEY, '1');
    } catch {
      // storage unavailable — safe to skip, hint just re-appears next session
    }
  }

  onDeleted(id: string): void {
    this.svc.delete(id);
    this.closeModal();
  }

  onDropped(event: { taskId: string; status: TaskStatus }): void {
    this.svc.moveTo(event.taskId, event.status);
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'n' && event.key !== 'N') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (this.modal().mode !== 'closed') return;
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    this.openCreate();
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable === true;
}
