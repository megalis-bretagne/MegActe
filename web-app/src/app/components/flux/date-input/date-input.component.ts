import { Component, Input } from '@angular/core';
import { Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { format, parse } from 'date-fns';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-date-input',
  templateUrl: './date-input.component.html',
})
export class DateInputComponent extends BaseInputComponent {
  @Input() default: string = '';
  @Input() allowPast: boolean = true;

  override getControlType(): string {
    return 'date';
  }

  override getDefaultValue(): string {
    if (this.default === 'now') {
      return this.formatDate(new Date());
    } else if (this.default.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsedDate = parse(this.default, 'dd/MM/yyyy', new Date());
      return this.formatDate(parsedDate);
    } else {
      return this.default; //Check it out
    }
  }

  override getValidators(): ValidatorFn[] {
    const validators = [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)];
    if (this.required) {
      validators.push(Validators.required);
    }
    if (!this.allowPast) {
      validators.push(this.noPastDateValidator());
    }
    return validators;
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
    return (control: AbstractControl): { [idField: string]: any } | null => {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const selectedDate = new Date(control.value);
      return selectedDate < currentDate ? { 'noPastDate': { value: control.value } } : null;
    };
  }
}
