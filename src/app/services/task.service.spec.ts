import { TestBed } from '@angular/core/testing';
import { TaskService, STORAGE_KEY } from './task.service';
import { TASK_STATUSES, Task } from '../models/task.model';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  afterEach(() => localStorage.clear());

  it('starts with no tasks when storage is empty', () => {
    expect(service.tasks()).toEqual([]);
  });

  it('creates a task with default status "New"', () => {
    const task = service.create({ title: 'Ship the MVP' });
    expect(task.status).toBe('New');
    expect(task.title).toBe('Ship the MVP');
    expect(service.tasks().length).toBe(1);
  });

  it('assigns unique ids to new tasks', () => {
    const a = service.create({ title: 'A' });
    const b = service.create({ title: 'B' });
    expect(a.id).not.toBe(b.id);
  });

  it('persists tasks to localStorage', () => {
    service.create({ title: 'Persisted' });
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as Task[];
    expect(parsed[0].title).toBe('Persisted');
  });

  it('hydrates from localStorage on init', () => {
    const seed: Task[] = [
      {
        id: 'seed-1',
        title: 'Preloaded',
        status: 'In Progress',
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    const fresh = new TaskService();
    expect(fresh.tasks()).toEqual(seed);
  });

  it('updates a task by id', () => {
    const t = service.create({ title: 'Draft' });
    service.update(t.id, { title: 'Final', description: 'done' });
    const updated = service.tasks().find((x) => x.id === t.id)!;
    expect(updated.title).toBe('Final');
    expect(updated.description).toBe('done');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(t.updatedAt);
  });

  it('moves a task to a new status', () => {
    const t = service.create({ title: 'Move me' });
    service.moveTo(t.id, 'Completed');
    expect(service.tasks().find((x) => x.id === t.id)!.status).toBe(
      'Completed',
    );
  });

  it('ignores moveTo when status is unchanged', () => {
    const t = service.create({ title: 'Static' });
    const before = t.updatedAt;
    service.moveTo(t.id, 'New');
    const after = service.tasks().find((x) => x.id === t.id)!.updatedAt;
    expect(after).toBe(before);
  });

  it('deletes a task by id', () => {
    const a = service.create({ title: 'A' });
    const b = service.create({ title: 'B' });
    service.delete(a.id);
    expect(service.tasks().map((t) => t.id)).toEqual([b.id]);
  });

  it('groups tasks by status across all lanes', () => {
    service.create({ title: 'a' });
    service.create({ title: 'b', status: 'Verified' });
    service.create({ title: 'c', status: 'Verified' });
    const grouped = service.tasksByStatus();
    expect(grouped['New'].length).toBe(1);
    expect(grouped['Verified'].length).toBe(2);
    for (const s of TASK_STATUSES) {
      expect(grouped[s]).toBeDefined();
    }
  });

  it('reports counts per status', () => {
    service.create({ title: 'a' });
    service.create({ title: 'b', status: 'In Progress' });
    const counts = service.counts();
    expect(counts['New']).toBe(1);
    expect(counts['In Progress']).toBe(1);
    expect(counts['Completed']).toBe(0);
  });

  it('ignores malformed localStorage payloads', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const fresh = new TaskService();
    expect(fresh.tasks()).toEqual([]);
  });
});
