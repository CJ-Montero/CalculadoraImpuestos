import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { CommonModule, NgSwitch, NgSwitchCase, NgIf, NgFor } from '@angular/common';

interface TaxResult {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  message: string;
}

@Component({
  selector: 'app-tax-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSwitch, NgSwitchCase, NgIf, NgFor],
  templateUrl: './tax-calculator.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block'
  }
})
export class TaxCalculatorComponent {
  private fb = inject(FormBuilder);

  // Form
  taxForm = this.fb.group({
    taxType: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    cost: [null as number | null, []], // Optional, required for GANANCIA_CAPITAL
    iscType: [''] // Optional, for ISC
  });

  // Signals for state management
  result = signal<TaxResult | null>(null);
  isLoading = signal(false);

  // Computed signal for result validation
  hasResult = computed(() => !!this.result());

  // ISC types for dropdown
  iscTypes = [
    { value: 'vehicle', label: 'Vehículo (17% + 18% ITBIS)' },
    { value: 'telecom', label: 'Telecomunicaciones (10%)' },
    { value: 'insurance', label: 'Seguros (8%)' },
    { value: 'cigarettes', label: 'Cigarrillos (RD$50 por cajetilla)' }
  ];

  constructor() {
    // Dynamically add Validators.required to cost when taxType is GANANCIA_CAPITAL
    this.taxTypeControl.valueChanges.subscribe(taxType => {
      if (taxType === 'GANANCIA_CAPITAL') {
        this.costControl.setValidators([Validators.required, Validators.min(0)]);
      } else {
        this.costControl.clearValidators();
      }
      this.costControl.updateValueAndValidity();
    });
  }

  // TrackBy function for *ngFor
  trackByValue(index: number, item: { value: string; label: string }): string {
    return item.value;
  }

  async calculateTax(): Promise<void> {
    if (this.taxForm.invalid) return;

    this.isLoading.set(true);
    // Simulate async calculation for feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    const { taxType, amount, cost, iscType } = this.taxForm.value;
    const baseAmount = Number(amount);

    let taxResult: TaxResult;

    switch (taxType) {
      case 'ITBIS':
        const itbisTax = baseAmount * 0.18;
        taxResult = {
          baseAmount,
          taxAmount: itbisTax,
          totalAmount: baseAmount + itbisTax,
          message: 'ITBIS calculado al 18%.'
        };
        break;

      case 'ISR':
        let isrTax = 0;
        let isrMessage = '';
        if (baseAmount <= 416220) {
          isrTax = 0;
          isrMessage = 'Exento de ISR (ingreso anual ≤ RD$416,220).';
        } else if (baseAmount <= 624329) {
          isrTax = (baseAmount - 416220) * 0.15;
          isrMessage = 'ISR calculado al 15% sobre el exceso de RD$416,220.';
        } else if (baseAmount <= 867123) {
          isrTax = (624329 - 416220) * 0.15 + (baseAmount - 624329) * 0.20;
          isrMessage = 'ISR calculado al 15% y 20% según tramos.';
        } else {
          isrTax = (624329 - 416220) * 0.15 + (867123 - 624329) * 0.20 + (baseAmount - 867123) * 0.25;
          isrMessage = 'ISR calculado al 15%, 20% y 25% según tramos.';
        }
        taxResult = {
          baseAmount,
          taxAmount: isrTax,
          totalAmount: baseAmount - isrTax,
          message: isrMessage
        };
        break;

      case 'REGALIA':
        taxResult = {
          baseAmount,
          taxAmount: 0,
          totalAmount: baseAmount,
          message: 'Regalía pascual equivalente a un salario mensual (no gravada con ISR).'
        };
        break;

      case 'ISC':
        if (!iscType) {
          this.taxForm.get('iscType')?.setErrors({ required: true });
          this.isLoading.set(false);
          return;
        }
        let iscTax = 0;
        let iscMessage = '';
        if (iscType === 'vehicle') {
          const itbis = baseAmount * 0.18;
          iscTax = baseAmount * 0.17;
          iscMessage = 'Impuesto a vehículos: 17% ISC + 18% ITBIS.';
          taxResult = {
            baseAmount,
            taxAmount: iscTax + itbis,
            totalAmount: baseAmount + iscTax + itbis,
            message: iscMessage
          };
        } else if (iscType === 'telecom') {
          iscTax = baseAmount * 0.10;
          iscMessage = 'ISC calculado al 10% para telecomunicaciones.';
          taxResult = {
            baseAmount,
            taxAmount: iscTax,
            totalAmount: baseAmount + iscTax,
            message: iscMessage
          };
        } else if (iscType === 'insurance') {
          iscTax = baseAmount * 0.08;
          iscMessage = 'ISC calculado al 8% para seguros.';
          taxResult = {
            baseAmount,
            taxAmount: iscTax,
            totalAmount: baseAmount + iscTax,
            message: iscMessage
          };
        } else if (iscType === 'cigarettes') {
          iscTax = 50;
          iscMessage = 'ISC fijo de RD$50 por cajetilla de cigarrillos.';
          taxResult = {
            baseAmount,
            taxAmount: iscTax,
            totalAmount: baseAmount + iscTax,
            message: iscMessage
          };
        } else {
          this.isLoading.set(false);
          return;
        }
        break;

      case 'DIVIDENDOS':
        const dividendTax = baseAmount * 0.10;
        taxResult = {
          baseAmount,
          taxAmount: dividendTax,
          totalAmount: baseAmount - dividendTax,
          message: 'Impuesto a los dividendos calculado al 10% (pago único).'
        };
        break;

      case 'CONSTITUCION':
        const constitucionTax = Math.max(baseAmount * 0.01, 1000);
        taxResult = {
          baseAmount,
          taxAmount: constitucionTax,
          totalAmount: baseAmount + constitucionTax,
          message: 'Impuesto a la constitución de empresas al 1% del capital social (mínimo RD$1,000).'
        };
        break;

      case 'IPI':
        let ipiTax = 0;
        let ipiMessage = '';
        const ipiThreshold = 10190833;
        if (baseAmount <= ipiThreshold) {
          ipiTax = 0;
          ipiMessage = `Exento de IPI (patrimonio ≤ RD$${ipiThreshold.toLocaleString('es-DO')}).`;
        } else {
          ipiTax = (baseAmount - ipiThreshold) * 0.01;
          ipiMessage = `IPI calculado al 1% sobre el exceso de RD$${ipiThreshold.toLocaleString('es-DO')}.`;
        }
        taxResult = {
          baseAmount,
          taxAmount: ipiTax,
          totalAmount: baseAmount + ipiTax,
          message: ipiMessage
        };
        break;

      case 'ACTIVOS':
        const activosTax = baseAmount * 0.01;
        taxResult = {
          baseAmount,
          taxAmount: activosTax,
          totalAmount: baseAmount + activosTax,
          message: 'Impuesto a los activos calculado al 1% (crédito contra ISR).'
        };
        break;

      case 'TRANSFERENCIAS':
        const transferTax = baseAmount * 0.0015;
        taxResult = {
          baseAmount,
          taxAmount: transferTax,
          totalAmount: baseAmount + transferTax,
          message: 'Impuesto a transferencias bancarias/cheques calculado al 0.15%.'
        };
        break;

      case 'PROPIEDADES':
        const propTax = baseAmount * 0.03;
        taxResult = {
          baseAmount,
          taxAmount: propTax,
          totalAmount: baseAmount + propTax,
          message: 'Impuesto a la transferencia de propiedades calculado al 3%.'
        };
        break;

      case 'SUCESIONES':
        const sucesionTax = baseAmount * 0.03;
        taxResult = {
          baseAmount,
          taxAmount: sucesionTax,
          totalAmount: baseAmount - sucesionTax,
          message: 'Impuesto a las sucesiones calculado al 3% sobre la herencia.'
        };
        break;

      case 'DONACIONES':
        const donacionTax = baseAmount * 0.27;
        taxResult = {
          baseAmount,
          taxAmount: donacionTax,
          totalAmount: baseAmount - donacionTax,
          message: 'Impuesto a las donaciones calculado al 27% (tasa ISR jurídica 2025).'
        };
        break;

      case 'GANANCIA_CAPITAL':
        if (cost == null) {
          this.taxForm.get('cost')?.setErrors({ required: true });
          this.isLoading.set(false);
          return;
        }
        const gain = baseAmount - cost;
        if (gain <= 0) {
          taxResult = {
            baseAmount,
            taxAmount: 0,
            totalAmount: baseAmount,
            message: 'No hay ganancia de capital (precio de venta ≤ costo de adquisición).'
          };
        } else {
          const gainTax = gain * 0.25; // Assuming person is an individual (25%)
          taxResult = {
            baseAmount,
            taxAmount: gainTax,
            totalAmount: baseAmount - gainTax,
            message: 'Impuesto a la ganancia de capital calculado al 25% sobre la ganancia.'
          };
        }
        break;

      default:
        this.isLoading.set(false);
        return;
    }

    this.result.set(taxResult);
    this.isLoading.set(false);
  }

  // Getters for easier form control access
  get taxTypeControl(): FormControl {
    return this.taxForm.get('taxType') as FormControl;
  }

  get amountControl(): FormControl {
    return this.taxForm.get('amount') as FormControl;
  }

  get costControl(): FormControl {
    return this.taxForm.get('cost') as FormControl;
  }

  get iscTypeControl(): FormControl {
    return this.taxForm.get('iscType') as FormControl;
  }
}