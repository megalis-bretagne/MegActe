import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { BaseInputComponent } from '../BaseInput.component';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'meg-text-input',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatTooltipModule],
  templateUrl: './text-input.component.html',
})
export class TextInputComponent extends BaseInputComponent {
  @Input() multiple: boolean = false;
  @Input() pregMatch: string = '';
  @Input() pregMatchError: string = '';
  @Input() index: boolean = false;

  override getControlType(): string {
    return 'text';
  }

  override getDefaultValue(): any {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    const validators = [];

    if (this.required) {
      validators.push(Validators.required);
    }

    if (this.pregMatch) {
      this.pregMatch = this.fieldFluxService.cleanRegex(this.pregMatch);
      validators.push(Validators.pattern(this.pregMatch));
    }

    return validators;
  }


  getErrorMessage() {
    if (this.control.hasError('required')) {
      return 'Ce champ est requis';
    } else if (this.control.hasError('pattern')) {
      return this.pregMatchError;
    }
    return '';
  }
}

