import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaxCalculatorComponent } from "./tax-calculator/tax-calculator";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TaxCalculatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('CalculadoraImpuestos');
}
