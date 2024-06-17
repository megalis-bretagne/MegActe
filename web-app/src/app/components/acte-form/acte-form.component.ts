import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { FluxService } from 'src/app/services/flux.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'app-acte-form',
  templateUrl: './acte-form.component.html',
  styleUrls: ['./acte-form.component.scss']
})
export class ActeFormComponent implements OnInit {

  acteNom: string;
  acteId: string;
  fluxDetail: any;
  textFields: any[];

  constructor(private route: ActivatedRoute, private fluxService: FluxService, private sharedDataService: SharedDataService, private logger: NGXLogger) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.acteNom = params.get('nom');
      if (this.acteNom) {
        const actes = this.sharedDataService.getFlux();
        const acte = actes.find(acte => acte.nom === this.acteNom);

        if (acte) {
          const acteId = acte.id;
          this.fluxService.get_flux_detail(acteId).subscribe(data => {
            this.fluxDetail = data;
            this.textFields = this.extractTextFields(data);
          });
        } else {
          this.logger.error('Flux not found for the given name');
        }
      }
    });
  }

  // Filtrer et récupérer les champs de type "text"
  extractTextFields(data: any): any[] {
    const textFields = [];
    for (const key in data) {
      const field = data[key];
      if (field.type === 'text') {
        if (field.preg_match) {
          field.preg_match = this.cleanRegex(field.preg_match);
        }
        textFields.push({ key: key, ...field });
      }
    }
    return textFields;
  }

  // Nettoyer les délimiteurs de l'expression régulière
  cleanRegex(regex: string): string {
    // Supprime les indicateurs (comme 'us') à la fin de l'expression
    const regexFlagsPattern = /[a-z]*$/;
    regex = regex.replace(regexFlagsPattern, '');

    // Supprime les délimiteurs de début et de fin
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
