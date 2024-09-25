import { Directive, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FieldFluxService } from 'src/app/core/services/field-flux.service';

@Directive()
export abstract class BaseInputComponent implements OnInit {
    @Input() idField: string = '';
    @Input() name: string = '';
    @Input() required: boolean = false;
    @Input() readOnly: boolean = false;
    @Input() comment: string = '';

    @Input() control: FormControl;
    controlId: string;

    constructor(protected fieldFluxService: FieldFluxService) {
        this.controlId = this.fieldFluxService.generateUniqueId(this.getControlType());
    }

    ngOnInit() {
        this.initInput();
    }

    initInput(): void {
        this.formControl.setValidators(this.getValidators());
        if (!this.formControl.value)
            this.formControl.setValue(this.getDefaultValue());
        if (this.readOnly)
            this.formControl.disable();
    }

    getIdField(): string {
        return this.idField;
    }

    get formControl(): FormControl {
        return this.control;
    }

    abstract getControlType(): string;

    abstract getDefaultValue(): any;

    abstract getValidators(): any[];
}
