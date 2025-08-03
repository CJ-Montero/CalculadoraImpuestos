import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxCalculator } from './tax-calculator';

describe('TaxCalculator', () => {
  let component: TaxCalculator;
  let fixture: ComponentFixture<TaxCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxCalculator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxCalculator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
