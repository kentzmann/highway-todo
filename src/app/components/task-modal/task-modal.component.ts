import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Task, TASK_STATUSES, TaskStatus } from '../../models/task.model';

export interface TaskFormValue {
  title: string;
  description: string;
  status: TaskStatus;
}

interface TaskForm {
  title: FormControl<string>;
  description: FormControl<string>;
  status: FormControl<TaskStatus>;
}

const TITLE_MAX_LENGTH = 120;

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-modal.component.html',
  styleUrl: './task-modal.component.scss',
})
export class TaskModalComponent implements OnChanges, AfterViewInit {
  @Input() task: Task | null = null;
  @Input() defaultStatus: TaskStatus = 'New';

  @Output() readonly saved = new EventEmitter<TaskFormValue>();
  @Output() readonly deleted = new EventEmitter<string>();
  @Output() readonly dismissed = new EventEmitter<void>();

  @ViewChild('titleInput') private titleInputRef?: ElementRef<HTMLInputElement>;

  readonly statuses = TASK_STATUSES;
  readonly titleMaxLength = TITLE_MAX_LENGTH;

  /**
   * Set true the moment ANY exit path is triggered (save, delete,
   * cancel, backdrop, escape). All four cancel-shaped exits happen
   * after the title input has already blurred, which flips
   * `titleCtrl.touched` to true; without this flag, the "Title is
   * required" error would paint for one frame between that blur and
   * the parent tearing the modal down via its `@if`. The template
   * gates every `.field-error` on `!isClosing()`.
   */
  readonly isClosing = signal(false);

  readonly form: FormGroup<TaskForm> = inject(FormBuilder).nonNullable.group({
    title: [
      '',
      [Validators.required, Validators.maxLength(TITLE_MAX_LENGTH)],
    ],
    description: [''],
    status: ['New' as TaskStatus, Validators.required],
  });

  get isEditing(): boolean {
    return this.task !== null;
  }

  get titleCtrl(): FormControl<string> {
    return this.form.controls.title;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] || changes['defaultStatus']) {
      this.resetForm();
    }
  }

  /**
   * Modal is created fresh every time it opens (parent uses `@if`),
   * so `ngAfterViewInit` fires on every open. Push focus onto the title
   * input as soon as the view exists — the user can start typing
   * immediately without a click.
   */
  ngAfterViewInit(): void {
    queueMicrotask(() => this.titleInputRef?.nativeElement.focus());
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.isClosing.set(true);
    this.saved.emit({
      title: raw.title.trim(),
      description: raw.description.trim(),
      status: raw.status,
    });
  }

  requestDelete(): void {
    if (!this.task) return;
    this.isClosing.set(true);
    this.deleted.emit(this.task.id);
  }

  dismiss(): void {
    this.isClosing.set(true);
    this.dismissed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.dismiss();
  }

  /**
   * Esc dismisses the modal only when the title is still empty — this
   * prevents accidentally throwing away edits mid-typing while keeping
   * the fast-cancel behavior expected for a freshly opened create modal.
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.titleCtrl.value.trim().length > 0) return;
    event.preventDefault();
    this.dismiss();
  }

  private resetForm(): void {
    this.form.reset({
      title: this.task?.title ?? '',
      description: this.task?.description ?? '',
      status: this.task?.status ?? this.defaultStatus,
    });
  }
}
