import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TaskStatus } from '../../models/task.model';

/**
 * Presentational digital-sign header. Doesn't touch the task store — parent
 * components pass the statuses to render and the current count per status.
 */
@Component({
  selector: 'app-toll-sensor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toll-sensor.component.html',
  styleUrl: './toll-sensor.component.scss',
})
export class TollSensorComponent {
  @Input({ required: true }) statuses!: readonly TaskStatus[];
  @Input({ required: true }) counts!: Record<TaskStatus, number>;
}
