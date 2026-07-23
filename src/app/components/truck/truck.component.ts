import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-truck',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './truck.component.html',
  styleUrl: './truck.component.scss',
})
export class TruckComponent {
  @Input({ required: true }) task!: Task;
  @Output() readonly opened = new EventEmitter<Task>();

  onActivate(event: Event): void {
    event.stopPropagation();
    this.opened.emit(this.task);
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onActivate(event);
    }
  }
}
