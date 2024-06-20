import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Data, Field } from 'src/app/model/field-form.model';
import { FieldFluxService } from 'src/app/services/field-flux.service';

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  acteName: string;
  fluxDetail: Data;
  textFields: Field[] = [];
  checkboxFields: Field[] = [];
  selectFields: Field[] = [];
  dateFields: Field[] = [];

  constructor(private route: ActivatedRoute, private logger: NGXLogger, private fieldFluxService: FieldFluxService
  ) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteName = this.route.snapshot.paramMap.get('nom');
      if (this.fluxDetail) {
        const { textFields, checkboxFields, selectFields, dateFields } = this.fieldFluxService.extractFields(this.fluxDetail);
        this.textFields = textFields;
        this.checkboxFields = checkboxFields;
        this.selectFields = selectFields;
        this.dateFields = dateFields;
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }
}
