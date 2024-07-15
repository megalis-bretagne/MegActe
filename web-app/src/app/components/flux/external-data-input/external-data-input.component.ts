import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NGXLogger } from 'ngx-logger';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { FluxService } from 'src/app/services/flux.service';
import { SharedDataService } from 'src/app/services/sharedData.service';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { BaseInputComponent } from '../BaseInput.component';

@Component({
  selector: 'meg-external-data-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './external-data-input.component.html'
})

export class ExternalDataInputComponent extends BaseInputComponent implements OnInit, AfterViewInit {
  @Input() link_name: string = '';

  externalDataOptions: string[] = [];
  filteredOptions: string[] = [];

  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  constructor(
    protected override fieldFluxService: FieldFluxService,
    private fluxService: FluxService,
    private sharedDataService: SharedDataService,
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

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.scrollEvent, true);
  }


  // Récupérer les données du champ
  private fetchExternalData(): void {
    const idField = this.idField;
    const id_e = this.sharedDataService.getUser().user_info.id_e;

    // TODO: Récupérer le documentId dynamiquement plutôt que de le coder en dur

    const documentId = 'chdhtrh';
    this.fluxService.get_externalData(id_e, documentId, idField).subscribe({
      next: (data) => {
        const filteredData = this.filterExternalData(data);
        this.externalDataOptions = this.removeNumbering(filteredData);
        this.setupAutoComplete();
      },
      error: (error) => {
        this.logger.error('Failed to retrieve external data', error);
      }
    });
  }

  // Filtrer les données en éliminant les titres du premier niveau
  private filterExternalData(data: any): string[] {
    return Object.keys(data).filter(idField => idField.split('.').length > 1);
  }

  // Retirer la numérotation des titres
  private removeNumbering(titles: string[]): string[] {
    return titles.map(title => title.replace(/^\d+(\.\d+)*\s*/, ''));
  }

  private setupAutoComplete(): void {
    this.formControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    ).subscribe(options => this.filteredOptions = options);
  }

  // Filtrer les options en fonction de la valeur saisie
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.externalDataOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private scrollEvent = (): void => {
    if (this.autoComplete.panelOpen) {
      this.autoComplete.updatePosition();
    }
  };
}