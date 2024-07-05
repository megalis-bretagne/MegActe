import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';

@Component({
  selector: 'meg-select-input',
  templateUrl: './select-input.component.html',
})
export class SelectInputComponent implements OnInit {
  @Input() key: string = '';
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() multiple: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() options: { [key: string]: string } = {};
  @Input() commentaire: string = '';


  selectControl: FormControl;
  selectId: string;

  constructor(private fieldFluxService: FieldFluxService) { }

  ngOnInit() {
    // Ajouter une option par défaut
    this.options = { '': 'Sélectionner une option', ...this.options };

    const validators = this.required ? [Validators.required] : [];
    this.selectControl = new FormControl({ value: '', disabled: this.readOnly }, validators);
    this.selectId = this.fieldFluxService.generateUniqueId('select');

    // Si le champ est requis et qu'il y a une seule option, cette option sera sélectionnée par défaut
    if (this.required && Object.keys(this.options).length === 2) {
      const singleValue = Object.keys(this.options).find(key => key !== '');
      if (singleValue) {
        this.selectControl.setValue(singleValue);
        this.selectControl.disable();
      }
    }
  }

  getValue(): any {
    return this.selectControl.value;
  }
  getKey(): string {
    return this.key;
  }

}
