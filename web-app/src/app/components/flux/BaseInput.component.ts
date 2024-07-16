import { Directive, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';

@Directive()
export abstract class BaseInputComponent implements OnInit {
    @Input() idField: string = '';
    @Input() name: string = '';
    @Input() required: boolean = false;
    @Input() readOnly: boolean = false;
    @Input() comment: string = '';

    formControl: FormControl;
    controlId: string;

    constructor(protected fieldFluxService: FieldFluxService) { }

    ngOnInit() {
        this.controlId = this.fieldFluxService.generateUniqueId(this.getControlType());
        this.formControl = new FormControl({ value: this.getDefaultValue(), disabled: this.readOnly }, this.getValidators());
    }

    getIdField(): string {
        return this.idField;
    }

    abstract getControlType(): string;

    abstract getDefaultValue(): any;

    abstract getValidators(): any[];
}
