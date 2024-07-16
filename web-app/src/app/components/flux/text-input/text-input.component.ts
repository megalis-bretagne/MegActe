import { Component, Input, OnInit } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-text-input',
  templateUrl: './text-input.component.html',
})
export class TextInputComponent extends BaseInputComponent implements OnInit {
  @Input() multiple: boolean = false;
  @Input() pregMatch: string = '';
  @Input() pregMatchError: string = '';
  @Input() index: boolean = false;

  constructor(protected override fieldFluxService: FieldFluxService) {
    super(fieldFluxService);
  }

  override ngOnInit() {
    super.ngOnInit();
  }

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
    if (this.formControl.hasError('required')) {
      return 'Ce champ est requis';
    } else if (this.formControl.hasError('pattern')) {
      return this.pregMatchError;
    }
    return '';
  }
}

