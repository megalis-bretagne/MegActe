import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { NGXLogger } from 'ngx-logger';
import { FieldFluxService } from 'src/app/core/services/field-flux.service';
import { BaseInputComponent } from '../BaseInput.component';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ExternalDataObject, HttpFluxService } from 'src/app/core/services/http/http-flux.service';

@Component({
  selector: 'meg-external-data-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './external-data-input.component.html'
})

export class ExternalDataInputComponent extends BaseInputComponent implements OnInit {

  private readonly _fluxService = inject(HttpFluxService);
  @Input() link_name: string = '';
  @Input() documentId: string = '';

  entiteSelected = inject(UserContextService).entiteSelected

  externalDataOptions: string[] = [];
  filteredOptions = signal<string[]>([]);

  @ViewChild('autoCompleteInput') input: ElementRef<HTMLInputElement>;

  constructor(
    protected override fieldFluxService: FieldFluxService,
    private readonly _logger: NGXLogger
  ) {
    super(fieldFluxService);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this._fetchExternalData();
  }

  override getControlType(): string {
    return 'externalData';
  }

  override getDefaultValue(): string {
    return '';
  }

  override getValidators(): ValidatorFn[] {
    return this.required ? [Validators.required] : [];
  }

  get idMenu(): string {
    return `dropdown-menu-${this.name}`;
  }

  get title(): string {
    return `Rechercher un élément dans la liste ${this.name}`;
  }

  public filter(): void {
    const filterValue = this.input.nativeElement.value.toLowerCase();
    this.filteredOptions.set(this.externalDataOptions.filter(o => o.toLowerCase().includes(filterValue)));
  }

  public selectOption(o: string) {
    this.formControl.setValue(o);
    this.input.nativeElement.value = "";
    this.filteredOptions.set(this.externalDataOptions);
    document.getElementById(this.idMenu).classList.add('hidden');
  }

  // Filtrer les données en éliminant les titres du premier niveau
  private _filterExternalData(data: ExternalDataObject): string[] {
    return Object.keys(data).filter(idField => idField.split('.').length > 1);
  }

  // Récupérer les données du champ
  private _fetchExternalData(): void {
    const id_e = this.entiteSelected().id_e;

    this._fluxService.get_externalData(id_e, this.documentId, this.idField).subscribe({
      next: (data) => {
        this.externalDataOptions = this._filterExternalData(data);
        this.filteredOptions.set(this.externalDataOptions);
      },
      error: (error) => {
        this._logger.error('Failed to retrieve external data', error);
      }
    });
  }
}