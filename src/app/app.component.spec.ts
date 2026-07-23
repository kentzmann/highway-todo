import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppComponent, SCROLL_HINT_STORAGE_KEY } from './app.component';
import { TaskService } from './services/task.service';
import { Task } from './models/task.model';

describe('AppComponent', () => {
  let service: TaskService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
    service = TestBed.inject(TaskService);
  });

  afterEach(() => localStorage.clear());

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders one lane per configured status', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-lane').length).toBe(5);
  });

  it('marks only the first (leftmost) lane as the create lane', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const lanes = fixture.nativeElement.querySelectorAll('app-lane .lane');
    expect(lanes[0].classList.contains('create-lane')).toBeTrue();
    expect(lanes[1].classList.contains('create-lane')).toBeFalse();
  });

  it('opens the modal in create mode when the create button is clicked', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.create-button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-task-modal')).toBeTruthy();
    expect(fixture.componentInstance.modal().mode).toBe('create');
  });

  it('shows the N hotkey hint inside the create button', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const kbd = fixture.nativeElement.querySelector('.create-button .hotkey');
    expect(kbd?.textContent.trim()).toBe('N');
  });

  it('opens the create modal when the N key is pressed', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);
    fixture.detectChanges();
    expect(fixture.componentInstance.modal().mode).toBe('create');
  });

  it('ignores the N hotkey while the modal is already open', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEdit({
      id: 'x',
      title: 'x',
      status: 'New',
      createdAt: 1,
      updatedAt: 1,
    });
    fixture.detectChanges();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(fixture.componentInstance.modal().mode).toBe('edit');
  });

  it('ignores the N hotkey while typing in a text field', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      bubbles: true,
    });
    input.dispatchEvent(event);
    fixture.detectChanges();
    expect(fixture.componentInstance.modal().mode).toBe('closed');
    document.body.removeChild(input);
  });

  it('ignores the N hotkey when combined with a modifier key', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'n', metaKey: true }),
    );
    expect(fixture.componentInstance.modal().mode).toBe('closed');
  });

  it('shows the scroll hint after the first task is created', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('New');
    fixture.componentInstance.onSaved({
      title: 'first',
      description: '',
      status: 'New',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.showScrollHint()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.scroll-hint')).toBeTruthy();
    expect(localStorage.getItem(SCROLL_HINT_STORAGE_KEY)).toBe('1');
  });

  it('does not show the scroll hint on the second task', () => {
    service.create({ title: 'existing' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('New');
    fixture.componentInstance.onSaved({
      title: 'second',
      description: '',
      status: 'New',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.showScrollHint()).toBeFalse();
  });

  it('does not show the scroll hint when the seen flag is already set', () => {
    localStorage.setItem(SCROLL_HINT_STORAGE_KEY, '1');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('New');
    fixture.componentInstance.onSaved({
      title: 'first',
      description: '',
      status: 'New',
    });
    expect(fixture.componentInstance.showScrollHint()).toBeFalse();
  });

  it('dismisses the scroll hint on click', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('New');
    fixture.componentInstance.onSaved({
      title: 'first',
      description: '',
      status: 'New',
    });
    fixture.detectChanges();
    fixture.componentInstance.dismissScrollHint();
    expect(fixture.componentInstance.showScrollHint()).toBeFalse();
  });

  it('auto-dismisses the scroll hint after the timeout', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('New');
    fixture.componentInstance.onSaved({
      title: 'first',
      description: '',
      status: 'New',
    });
    expect(fixture.componentInstance.showScrollHint()).toBeTrue();
    tick(6000);
    expect(fixture.componentInstance.showScrollHint()).toBeFalse();
  }));

  it('creates a task via the modal save handler and closes the modal', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openCreate('In Progress');
    fixture.componentInstance.onSaved({
      title: 'Deliver',
      description: '',
      status: 'In Progress',
    });
    fixture.detectChanges();
    expect(service.tasks().length).toBe(1);
    expect(service.tasks()[0].status).toBe('In Progress');
    expect(fixture.componentInstance.modal().mode).toBe('closed');
  });

  it('moves a task between lanes via onDropped', () => {
    const t = service.create({ title: 'Drop me' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.onDropped({ taskId: t.id, status: 'Verified' });
    expect(service.tasks()[0].status).toBe('Verified');
  });

  it('opens edit mode when a truck is clicked and updates the task on save', () => {
    const t = service.create({ title: 'Edit me' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEdit(t);
    fixture.componentInstance.onSaved({
      title: 'Renamed',
      description: 'notes',
      status: 'Completed',
    });
    const updated = service.tasks().find((x) => x.id === t.id)!;
    expect(updated.title).toBe('Renamed');
    expect(updated.status).toBe('Completed');
  });

  it('deletes a task via the modal delete handler', () => {
    const t = service.create({ title: 'Kill me' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fixture.componentInstance.openEdit(t);
    fixture.componentInstance.onDeleted(t.id);
    expect(service.tasks().length).toBe(0);
  });

  it('renders one gantry sign plate per status with the status name', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const plates = fixture.nativeElement.querySelectorAll(
      '.gantry .sign-plate .sign-text',
    );
    const texts = Array.from(plates).map((el) =>
      (el as HTMLElement).textContent!.trim(),
    );
    expect(texts).toEqual([
      'New',
      'In Progress',
      'Rejected',
      'Verified',
      'Completed',
    ]);
  });
});

// Small type guard to make TS happy in exhaustive tests without unused imports
export const _ensureTaskType: (t: Task) => Task = (t) => t;
