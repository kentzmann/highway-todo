import { TestBed } from '@angular/core/testing';
import { TollSensorComponent } from './toll-sensor.component';
import { TASK_STATUSES, TaskStatus } from '../../models/task.model';

describe('TollSensorComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [TollSensorComponent] }),
  );

  function mount(counts: Partial<Record<TaskStatus, number>> = {}) {
    const filled = TASK_STATUSES.reduce(
      (out, s) => ({ ...out, [s]: counts[s] ?? 0 }),
      {} as Record<TaskStatus, number>,
    );
    const fixture = TestBed.createComponent(TollSensorComponent);
    fixture.componentRef.setInput('statuses', TASK_STATUSES);
    fixture.componentRef.setInput('counts', filled);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one sign cell per provided status', () => {
    const fixture = mount();
    expect(fixture.nativeElement.querySelectorAll('.sign-cell').length).toBe(
      5,
    );
  });

  it('renders the counts provided via @Input', () => {
    const fixture = mount({ New: 1, Verified: 2 });
    const verified = fixture.nativeElement.querySelector(
      '[data-status="Verified"] .sign-count',
    );
    const newCell = fixture.nativeElement.querySelector(
      '[data-status="New"] .sign-count',
    );
    expect(verified.textContent.trim()).toBe('2');
    expect(newCell.textContent.trim()).toBe('1');
  });
});
