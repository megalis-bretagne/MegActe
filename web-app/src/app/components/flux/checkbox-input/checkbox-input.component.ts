import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';

@Component({
  selector: 'meg-checkbox-input',
  templateUrl: './checkbox-input.component.html',
})

export class CheckboxInputComponent implements OnInit {
  @Input() key: string = '';
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() defaultChecked: boolean = false;

  checkboxControl: FormControl;
  checkboxId: string;

  constructor(private fieldFluxService: FieldFluxService) { }

  ngOnInit() {
    this.checkboxId = this.fieldFluxService.generateUniqueId('checkbox');
    this.checkboxControl = new FormControl({ value: this.defaultChecked, disabled: this.readOnly });
  }

  getValue(): any {
    return this.checkboxControl.value;
  }

  getKey(): string {
    return this.key;
  }

}
