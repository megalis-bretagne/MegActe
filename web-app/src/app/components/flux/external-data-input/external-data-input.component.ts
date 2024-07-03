import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NGXLogger } from 'ngx-logger';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { FluxService } from 'src/app/services/flux.service';
import { SharedDataService } from 'src/app/services/sharedData.service';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'meg-external-data-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule],
  templateUrl: './external-data-input.component.html'
})

export class ExternalDataInputComponent implements OnInit, AfterViewInit {
  @Input() name: string = '';
  @Input() required: boolean = false;
  @Input() link_name: string = '';

  externalDataControl: FormControl;
  externalDataId: string;
  externalDataOptions: string[] = [];
  filteredOptions: Observable<string[]>;

  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;

  constructor(
    private fieldFluxService: FieldFluxService,
    private fluxService: FluxService,
    private sharedDataService: SharedDataService,
    private logger: NGXLogger
  ) { }

  ngOnInit(): void {
    this.initializeFormControl();
    this.setExternalDataId();
    this.fetchExternalData();
  }

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.scrollEvent, true);
  }

  // Initialiser le formulaire avec des validateurs
  private initializeFormControl(): void {
    const validators = this.required ? [Validators.required] : [];
    this.externalDataControl = new FormControl('', validators);
  }

  private setExternalDataId(): void {
    this.externalDataId = this.fieldFluxService.generateUniqueId('externalData');
  }

  // Récupérer les données du champ
  private fetchExternalData(): void {
    const idChamp = this.sharedDataService.getFieldIdFromFluxDetailByName(this.name);
    const id_e = this.sharedDataService.getUser().user_info.id_e;

    // TODO: Récupérer le documentId dynamiquement plutôt que de le coder en dur

    const documentId = 'chdhtrh';
    this.fluxService.get_externalData(id_e, documentId, idChamp).subscribe({
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
    return Object.keys(data).filter(key => key.split('.').length > 1);
  }

  // Retirer la numérotation des titres
  private removeNumbering(titles: string[]): string[] {
    return titles.map(title => title.replace(/^\d+(\.\d+)*\s*/, ''));
  }

  private setupAutoComplete(): void {
    this.filteredOptions = this.externalDataControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  // Filtrer les options en fonction de la valeur saisie
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.externalDataOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  scrollEvent = (): void => {
    if (this.autoComplete.panelOpen) {
      this.autoComplete.updatePosition();
    }
  };
}
