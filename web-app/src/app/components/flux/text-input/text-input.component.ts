import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
})
export class TextInputComponent implements OnInit {
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() multiple: boolean = false;
  @Input() pregMatch: string = '';
  @Input() pregMatchError: string = '';
  @Input() index: boolean = false;
  @Input() commentaire: string = '';

  inputControl: FormControl;
  inputId: string;

  constructor(private fieldFluxService: FieldFluxService) { }

  ngOnInit() {
    const validators = [];

    if (this.required) {
      validators.push(Validators.required);
    }

    if (this.pregMatch) {
      validators.push(Validators.pattern(this.pregMatch));
    }

    this.inputControl = new FormControl('', validators);
    this.inputId = this.fieldFluxService.generateUniqueId('input');
  }

  getErrorMessage() {
    if (this.inputControl.hasError('required')) {
      return 'Ce champ est requis';
    } else if (this.inputControl.hasError('pattern')) {
      return this.pregMatchError;
    }
    return '';
  }
}

