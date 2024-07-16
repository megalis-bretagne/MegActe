import { Component, Input, OnInit } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-select-input',
  templateUrl: './select-input.component.html',
})
export class SelectInputComponent extends BaseInputComponent implements OnInit {
  @Input() multiple: boolean = false;
  @Input() options: { [idField: string]: string } = {};


  override ngOnInit() {
    // Ajouter une option par défaut
    this.options = { '': 'Sélectionner une option', ...this.options };
    super.ngOnInit();

    // Si le champ est requis et qu'il y a une seule option, cette option sera sélectionnée par défaut
    if (this.required && Object.keys(this.options).length === 2) {
      const singleValue = Object.keys(this.options).find(idField => idField !== '');
      if (singleValue) {
        this.formControl.setValue(singleValue);
        this.formControl.disable();
      }
    }
  }

  override getControlType(): string {
    return 'select';
  }

  override getDefaultValue(): any {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }


}
