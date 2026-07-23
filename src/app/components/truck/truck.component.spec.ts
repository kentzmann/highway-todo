import { TestBed } from '@angular/core/testing';
import { TruckComponent } from './truck.component';
import { Task } from '../../models/task.model';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Deliver payload',
    status: 'New',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('TruckComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [TruckComponent] }),
  );

  it('renders the task title inside the cargo label', () => {
    const fixture = TestBed.createComponent(TruckComponent);
    fixture.componentRef.setInput('task', makeTask({ title: 'Ship it' }));
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cargo-label');
    expect(label.textContent.trim()).toBe('Ship it');
  });

  it('emits `opened` with the task when clicked', () => {
    const fixture = TestBed.createComponent(TruckComponent);
    const task = makeTask();
    fixture.componentRef.setInput('task', task);
    let emitted: Task | undefined;
    fixture.componentInstance.opened.subscribe((t) => (emitted = t));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.truck').click();
    expect(emitted).toBe(task);
  });

  it('emits `opened` on Enter keydown', () => {
    const fixture = TestBed.createComponent(TruckComponent);
    const task = makeTask();
    fixture.componentRef.setInput('task', task);
    let emitted: Task | undefined;
    fixture.componentInstance.opened.subscribe((t) => (emitted = t));
    fixture.detectChanges();
    const truck = fixture.nativeElement.querySelector('.truck') as HTMLElement;
    truck.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toBe(task);
  });
});
