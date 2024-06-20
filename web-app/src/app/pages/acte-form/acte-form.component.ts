import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {
  //Text input
  acteName: string;
  fluxDetail: any;
  textFields: any[] = [];

  //Checkbox
  checkboxFields: any[] = [];

  //Select
  selectFields: any[] = [];

  //date
  dateFields: any[] = [];


  constructor(private route: ActivatedRoute, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteName = this.route.snapshot.paramMap.get('nom');
      if (this.fluxDetail) {
        this.extractFields(this.fluxDetail);
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  //filtrer et de récupérer les champs selon le type 
  extractFields(data: any): void {
    for (const key in data) {
      const field = { key: key, ...data[key] };
      switch (data[key].type) {
        case 'text':
          if (field.preg_match) {
            field.preg_match = this.cleanRegex(field.preg_match);
          }
          this.textFields.push(field);
          break;
        case 'checkbox':
          this.checkboxFields.push(field);
          break;
        case 'select':
          this.selectFields.push(field);
          break;
        case 'date':
          this.dateFields.push(field);
          break;
      }
    }
  }

  // Nettoyer les délimiteurs de l'expression régulière
  cleanRegex(regex: string): string {
    const regexFlagsPattern = /[a-z]*$/;
    regex = regex.replace(regexFlagsPattern, '');

    const delimiters = ['/', '#', '~', '|', '!', '@', '%', ';', ':', '^'];
    if (delimiters.includes(regex.charAt(0))) {
      regex = regex.substring(1);
    }
    if (delimiters.includes(regex.charAt(regex.length - 1))) {
      regex = regex.slice(0, -1);
    }

    return regex;
  }
}
