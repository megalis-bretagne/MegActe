import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { BaseInputComponent } from '../BaseInput.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'meg-select-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './select-input.component.html',
})
export class SelectInputComponent extends BaseInputComponent {
  @Input() multiple: boolean = false;
  @Input() options: { [idField: string]: string } = {};

  override initInput() {
    // Si le champ est requis et qu'il y a une seule option, cette option sera sélectionnée par défaut
    const optionKeys = Object.keys(this.options);
    if (this.required && optionKeys.length === 1) {
      this.formControl.setValue(optionKeys[0]);
      this.formControl.disable();
    }
    this.formControl.setValidators(this.getValidators());
  }

  override getControlType(): string {
    return 'select';
  }


  override getDefaultValue(): string {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }
}
