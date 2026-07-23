export const TASK_STATUSES = [
  'New',
  'In Progress',
  'Rejected',
  'Verified',
  'Completed',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

export type NewTaskInput = Pick<Task, 'title'> &
  Partial<Pick<Task, 'description' | 'status'>>;
