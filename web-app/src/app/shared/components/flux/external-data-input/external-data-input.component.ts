import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NGXLogger } from 'ngx-logger';
import { FieldFluxService } from 'src/app/core/services/field-flux.service';
import { FluxService } from 'src/app/core/services/flux.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseInputComponent } from '../BaseInput.component';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'meg-external-data-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './external-data-input.component.html'
})

export class ExternalDataInputComponent extends BaseInputComponent implements OnInit {
  @Input() link_name: string = '';
  @Input() documentId: string = '';

  currentUser = inject(UserContextService).userCurrent

  externalDataOptions: string[] = [];
  filteredOptions: string[] = [];

  @ViewChild('autoCompleteInput') input: ElementRef<HTMLInputElement>;

  constructor(
    protected override fieldFluxService: FieldFluxService,
    private fluxService: FluxService,
    private logger: NGXLogger
  ) {
    super(fieldFluxService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.fetchExternalData();
  }

  override getControlType(): string {
    return 'externalData';
  }

  override getDefaultValue(): any {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }

  // Récupérer les données du champ
  private fetchExternalData(): void {
    const id_e = this.currentUser().user_info.id_e;

    this.fluxService.get_externalData(id_e, this.documentId, this.idField).subscribe({
      next: (data) => {
        const filteredData = this._filterExternalData(data);
        this.externalDataOptions = this._removeNumbering(filteredData);
        this.filteredOptions = this.externalDataOptions;
      },
      error: (error) => {
        this.logger.error('Failed to retrieve external data', error);
      }
    });
  }

  public filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions = this.externalDataOptions.filter(o => o.toLowerCase().includes(filterValue));
  }

  // Filtrer les données en éliminant les titres du premier niveau
  private _filterExternalData(data: any): string[] {
    return Object.keys(data).filter(idField => idField.split('.').length > 1);
  }

  // Retirer la numérotation des titres
  private _removeNumbering(titles: string[]): string[] {
    return titles.map(title => title.replace(/^\d+(\.\d+)*\s*/, ''));
  }


}