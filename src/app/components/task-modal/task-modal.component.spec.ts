import { TestBed } from '@angular/core/testing';
import { TaskModalComponent, TaskFormValue } from './task-modal.component';
import { Task } from '../../models/task.model';

describe('TaskModalComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [TaskModalComponent] }),
  );

  it('shows "New Task" and a Create button in create mode', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.componentRef.setInput('defaultStatus', 'New');
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('h2').textContent;
    const submit = fixture.nativeElement.querySelector('.btn-primary')
      .textContent;
    expect(header.trim()).toBe('New Task');
    expect(submit.trim()).toBe('Create');
    expect(fixture.nativeElement.querySelector('.btn-danger')).toBeNull();
  });

  it('populates the reactive form and shows Delete in edit mode', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    const task: Task = {
      id: 't1',
      title: 'Existing',
      description: 'Notes',
      status: 'Verified',
      createdAt: 1,
      updatedAt: 1,
    };
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    const value = fixture.componentInstance.form.getRawValue();
    expect(value.title).toBe('Existing');
    expect(value.description).toBe('Notes');
    expect(value.status).toBe('Verified');
    expect(fixture.nativeElement.querySelector('.btn-danger')).toBeTruthy();
  });

  it('flags the title control as invalid when empty and disables submit', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.titleCtrl.hasError('required')).toBeTrue();
    expect(c.form.invalid).toBeTrue();
    const btn = fixture.nativeElement.querySelector(
      '.btn-primary',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();
  });

  it('shows the required error only after the title control is touched', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeNull();
    fixture.componentInstance.titleCtrl.markAsTouched();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.field-error').textContent,
    ).toContain('required');
  });

  it('emits saved with trimmed values when the form submits', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.form.setValue({
      title: '  Ship it  ',
      description: '  do it  ',
      status: 'In Progress',
    });
    let payload: TaskFormValue | undefined;
    c.saved.subscribe((v) => (payload = v));
    c.submit();
    expect(payload).toEqual({
      title: 'Ship it',
      description: 'do it',
      status: 'In Progress',
    });
  });

  it('does not emit saved when the form is invalid', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.saved.subscribe(() => (emitted = true));
    fixture.componentInstance.submit();
    expect(emitted).toBeFalse();
  });

  it('emits deleted with the task id', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.componentRef.setInput('task', {
      id: 'del-me',
      title: 't',
      status: 'New',
      createdAt: 1,
      updatedAt: 1,
    } as Task);
    fixture.detectChanges();
    let deletedId: string | undefined;
    fixture.componentInstance.deleted.subscribe((id) => (deletedId = id));
    fixture.componentInstance.requestDelete();
    expect(deletedId).toBe('del-me');
  });

  it('dismisses on Escape when the title is empty', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dismissed).toBeTrue();
  });

  it('ignores Escape when the title has any text', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    let dismissed = false;
    fixture.componentInstance.titleCtrl.setValue('draft');
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dismissed).toBeFalse();
  });

  it('focuses the title input after the view initializes', (done) => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    queueMicrotask(() => {
      const input = fixture.nativeElement.querySelector(
        'input[formControlName="title"]',
      ) as HTMLInputElement;
      expect(document.activeElement).toBe(input);
      fixture.nativeElement.remove();
      done();
    });
  });

  it('emits dismissed when the backdrop itself is clicked', () => {
    const fixture = TestBed.createComponent(TaskModalComponent);
    fixture.detectChanges();
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));
    const backdrop = fixture.nativeElement.querySelector(
      '.modal-backdrop',
    ) as HTMLElement;
    backdrop.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(dismissed).toBeTrue();
  });
});
