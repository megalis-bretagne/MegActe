import { Component, Input, OnInit } from '@angular/core';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-checkbox-input',
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

  override getValidators(): any[] {
    return [];
  }
}
