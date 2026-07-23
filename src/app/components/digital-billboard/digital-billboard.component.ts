import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

/**
 * 3-wide × 5-tall dot patterns for digits 0-9. `'1'` = lit dot, `'0'` =
 * off dot. Each string is one row from top to bottom. Same glyph set
 * you'd see on a highway "amount of vehicles" LED sign.
 */
const DIGIT_PATTERNS: Record<string, readonly string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '010', '100', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
};

const DIGIT_ROWS = 5;
const DIGIT_COLS = 3;

@Component({
  selector: 'app-digital-billboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './digital-billboard.component.html',
  styleUrl: './digital-billboard.component.scss',
})
export class DigitalBillboardComponent {
  @Input({ required: true }) value = 0;

  readonly rows = Array.from({ length: DIGIT_ROWS }, (_, i) => i);
  readonly cols = Array.from({ length: DIGIT_COLS }, (_, i) => i);

  get digits(): string[] {
    return String(Math.max(0, Math.floor(this.value))).split('');
  }

  isLit(digit: string, row: number, col: number): boolean {
    const pattern = DIGIT_PATTERNS[digit];
    if (!pattern) return false;
    return pattern[row]?.[col] === '1';
  }
}
