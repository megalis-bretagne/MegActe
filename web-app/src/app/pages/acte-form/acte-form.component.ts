import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { CheckboxInputComponent } from 'src/app/components/flux/checkbox-input/checkbox-input.component';
import { DateInputComponent } from 'src/app/components/flux/date-input/date-input.component';
import { ExternalDataInputComponent } from 'src/app/components/flux/external-data-input/external-data-input.component';
import { SelectInputComponent } from 'src/app/components/flux/select-input/select-input.component';
import { TextInputComponent } from 'src/app/components/flux/text-input/text-input.component';

import { Data, Field } from 'src/app/model/field-form.model';
import { DocumentService } from 'src/app/services/document.service';
import { FieldFluxService } from 'src/app/services/field-flux.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  acteName: string;
  fluxDetail: Data;
  fields: Field[] = [];
  documentId: string;

  @ViewChildren(TextInputComponent) textInputs: QueryList<TextInputComponent>;
  @ViewChildren(CheckboxInputComponent) checkboxInputs: QueryList<CheckboxInputComponent>;
  @ViewChildren(SelectInputComponent) selectInputs: QueryList<SelectInputComponent>;
  @ViewChildren(DateInputComponent) dateInputs: QueryList<DateInputComponent>;
  @ViewChildren(ExternalDataInputComponent) externalDataInputs: QueryList<ExternalDataInputComponent>;

  constructor(private route: ActivatedRoute, private logger: NGXLogger, private fieldFluxService: FieldFluxService, private sharedDataService: SharedDataService, private documentService: DocumentService,

  ) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteName = this.route.snapshot.paramMap.get('nom');
      this.documentId = this.route.snapshot.paramMap.get('documentId');
      if (this.fluxDetail) {
        this.fields = this.fieldFluxService.extractFields(this.fluxDetail);
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  enregistrer(): void {
    const docInfo = this.collectFormData();
    const docUpdateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      doc_info: docInfo
    };

    this.documentService.updateDocument(this.documentId, docUpdateInfo).subscribe({
      next: (response) => this.logger.info('Document updated successfully', response),
      error: (error) => this.logger.error('Error updating document', error)
    });
  }

  transmettre(): void {

  }

  collectFormData(): { [key: string]: any } {
    const formData: { [key: string]: any } = {};

    this.textInputs.forEach(comp => formData[comp.getKey()] = comp.getValue());
    this.checkboxInputs.forEach(comp => formData[comp.getKey()] = comp.getValue());
    this.selectInputs.forEach(comp => formData[comp.getKey()] = comp.getValue());
    this.dateInputs.forEach(comp => formData[comp.getKey()] = comp.getValue());
    this.externalDataInputs.forEach(comp => formData[comp.getKey()] = comp.getValue());

    return formData;
  }
}
