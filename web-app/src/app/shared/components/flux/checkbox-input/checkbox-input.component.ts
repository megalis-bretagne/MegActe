import { Component, Input } from '@angular/core';
import { BaseInputComponent } from '../BaseInput.component';
import { FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'meg-checkbox-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './checkbox-input.component.html',
})

export class CheckboxInputComponent extends BaseInputComponent {
  @Input() defaultChecked: boolean = false;

  override getControlType(): string {
    return 'checkbox';
  }

  override getDefaultValue(): boolean {
    return this.defaultChecked;
  }

  override getValidators(): ValidatorFn[] {
    return [];
  }
}
