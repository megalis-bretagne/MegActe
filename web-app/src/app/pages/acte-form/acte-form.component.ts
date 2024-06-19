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
  textFields: any[];

  //Checkbox
  checkboxFields: any[];

  //Select
  selectFields: any[];

  constructor(private route: ActivatedRoute, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteName = this.route.snapshot.paramMap.get('nom');
      if (this.fluxDetail) {
        this.textFields = this.extractFields(this.fluxDetail, 'text');
        this.checkboxFields = this.extractFields(this.fluxDetail, 'checkbox');
        this.selectFields = this.extractFields(this.fluxDetail, 'select');
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  //filtrer et de récupérer les champs selon le type 
  extractFields(data: any, type: string): any[] {
    const fields = [];
    for (const key in data) {
      if (data[key].type === type) {
        // Si le type est 'text' et que 'preg_match' est présent, nettoyer l'expression régulière
        if (type === 'text' && data[key].preg_match) {
          data[key].preg_match = this.cleanRegex(data[key].preg_match);
        }
        fields.push({ key: key, ...data[key] });
      }
    }
    return fields;
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
