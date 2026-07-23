import { TestBed } from '@angular/core/testing';
import { DigitalBillboardComponent } from './digital-billboard.component';

describe('DigitalBillboardComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DigitalBillboardComponent],
    }),
  );

  function mount(value: number) {
    const fixture = TestBed.createComponent(DigitalBillboardComponent);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one 3×5 digit grid for a single-digit value', () => {
    const fixture = mount(5);
    expect(fixture.nativeElement.querySelectorAll('.digit').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.dot').length).toBe(15);
  });

  it('renders two 3×5 digit grids for a two-digit value', () => {
    const fixture = mount(42);
    expect(fixture.nativeElement.querySelectorAll('.digit').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.dot').length).toBe(30);
  });

  it('lights 12 dots for the digit "0"', () => {
    const fixture = mount(0);
    expect(
      fixture.nativeElement.querySelectorAll('.dot--on').length,
    ).toBe(12);
  });

  it('lights 13 dots for the digit "8"', () => {
    const fixture = mount(8);
    expect(
      fixture.nativeElement.querySelectorAll('.dot--on').length,
    ).toBe(13);
  });

  it('clamps negative values to render "0"', () => {
    const fixture = mount(-3);
    expect(fixture.nativeElement.querySelectorAll('.digit').length).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll('.dot--on').length,
    ).toBe(12);
  });

  it('truncates non-integer values towards zero', () => {
    const fixture = mount(7.9);
    // 7 lights: 111 / 001 / 010 / 010 / 010 = 3+1+1+1+1 = 7
    expect(
      fixture.nativeElement.querySelectorAll('.dot--on').length,
    ).toBe(7);
  });
});
