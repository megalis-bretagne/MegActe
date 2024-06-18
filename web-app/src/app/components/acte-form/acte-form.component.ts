import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {

  acteNom: string;
  fluxDetail: any;
  textFields: any[];

  constructor(private route: ActivatedRoute, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.fluxDetail = data['fluxDetail'];
      this.acteNom = this.route.snapshot.paramMap.get('nom');
      if (this.fluxDetail) {
        this.textFields = this.extractTextFields(this.fluxDetail);
      } else {
        this.logger.error('Flux detail not found for the given acte');
      }
    });
  }

  //filtrer et de récupérer les champs de type "text"
  extractTextFields(data: any): any[] {
    const textFields = [];
    for (const key in data) {
      if (data[key].type === 'text') {
        if (data[key].preg_match) {
          data[key].preg_match = this.cleanRegex(data[key].preg_match);
        }
        textFields.push({ key: key, ...data[key] });
      }
    }
    return textFields;
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
