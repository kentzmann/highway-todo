import { Injectable, computed, signal } from '@angular/core';
import {
  NewTaskInput,
  Task,
  TASK_STATUSES,
  TaskStatus,
} from '../models/task.model';

export const STORAGE_KEY = 'highway-todo::tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly _tasks = signal<Task[]>(this.readStorage());

  readonly tasks = this._tasks.asReadonly();

  readonly tasksByStatus = computed(() => {
    const grouped: Record<TaskStatus, Task[]> = emptyByStatus();
    for (const t of this._tasks()) grouped[t.status].push(t);
    return grouped;
  });

  readonly counts = computed(() => {
    const by = this.tasksByStatus();
    const out = {} as Record<TaskStatus, number>;
    for (const s of TASK_STATUSES) out[s] = by[s].length;
    return out;
  });

  create(input: NewTaskInput): Task {
    const now = Date.now();
    const task: Task = {
      id: cryptoId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      status: input.status ?? 'New',
      createdAt: now,
      updatedAt: now,
    };
    this.commit([...this._tasks(), task]);
    return task;
  }

  update(
    id: string,
    patch: Partial<Pick<Task, 'title' | 'description' | 'status'>>,
  ): void {
    this.commit(
      this._tasks().map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              title: patch.title?.trim() ?? t.title,
              description:
                patch.description !== undefined
                  ? patch.description.trim() || undefined
                  : t.description,
              updatedAt: Date.now(),
            }
          : t,
      ),
    );
  }

  moveTo(id: string, status: TaskStatus): void {
    const current = this._tasks().find((t) => t.id === id);
    if (!current || current.status === status) return;
    this.update(id, { status });
  }

  delete(id: string): void {
    this.commit(this._tasks().filter((t) => t.id !== id));
  }

  private commit(next: Task[]): void {
    this._tasks.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode, quota) — keep in-memory state
    }
  }

  private readStorage(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Task[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

function emptyByStatus(): Record<TaskStatus, Task[]> {
  const out = {} as Record<TaskStatus, Task[]>;
  for (const s of TASK_STATUSES) out[s] = [];
  return out;
}

function cryptoId(): string {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
