import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { format, parse } from 'date-fns';

@Component({
  selector: 'meg-date-input',
  templateUrl: './date-input.component.html',
})
export class DateInputComponent implements OnInit {
  @Input() key: string = '';
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() default: string = '';
  @Input() allowPast: boolean = true;
  @Input() commentaire: string = '';

  dateControl: FormControl;
  dateId: string;

  constructor(private fieldFluxService: FieldFluxService) { }

  ngOnInit() {
    const validators = [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)];
    if (this.required) {
      validators.push(Validators.required);
    }

    if (!this.allowPast) {
      validators.push(this.noPastDateValidator());
    }

    let initialDate = '';
    if (this.default === 'now') {
      initialDate = this.formatDate(new Date());
    } else if (this.default) {
      if (this.default.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const parsedDate = parse(this.default, 'dd/MM/yyyy', new Date());
        initialDate = this.formatDate(parsedDate);
      } else {
        initialDate = this.formatDate(new Date(this.default));
      }
    }

    this.dateControl = new FormControl({ value: initialDate, disabled: false }, validators);
    this.dateId = this.fieldFluxService.generateUniqueId('date');
  }

  getKey(): string {
    return this.key;
  }

  formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  // Récupérer la date minimale pour le contrôle de validité (Si allowPast est false)
  getMinDate(): string | null {
    return this.allowPast ? null : this.formatDate(new Date());
  }

  // Interdire les dates passées
  noPastDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const selectedDate = new Date(control.value);
      return selectedDate < currentDate ? { 'noPastDate': { value: control.value } } : null;
    };
  }
}
