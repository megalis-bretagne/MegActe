import { inject, Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from 'src/environments/settings.service';

@Pipe({
  name: 'stateDocument',
  standalone: true
})
export class StateDocumentPipe implements PipeTransform {

  /**
   * Surcharge du mapping
   */
  mapStatusDocument = inject(SettingsService).getMappingStatusDocument();

  transform(state: string): unknown {
    if (this.mapStatusDocument) { // si le mapping est surchargé en settings, il est prioritaire
      return this.mapStatusDocument[state] || this.defaultMapping[state] || state
    }
    return this.defaultMapping[state] || state;
  }

  private defaultMapping: { [key: string]: string } = {
    'termine': 'Traitement terminé',
    'error-ged': 'Erreur lors du dépôt à la GED',
    'accepter-sae': 'Archiver SAE',
    'tdt-error': 'Erreur transmission tdt',
    'recu-iparapheur': 'Transmis au parapheur',
    'fatal-error': 'Erreur inconnue',
    'modification': 'En cours de rédaction',
    'creation': 'En cours de rédaction'
  };

}
