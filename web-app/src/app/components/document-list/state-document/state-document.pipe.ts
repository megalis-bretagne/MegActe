import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stateDocument',
  standalone: true
})
export class StateDocumentPipe implements PipeTransform {

  transform(state: string): unknown {
    return this.displayMapping[state] || state;
  }

  private displayMapping: { [key: string]: string } = {
    'termine': 'Traitement terminé',
    'accepter-sae': 'Archiver SAE',
    'tdt-error': 'Erreur transmission tdt',
    'recu-iparapheur': 'Transmis au parapheur',
    'fatal-error': 'Erreur inconnue',
    'modification': 'En cours de rédaction',
    'creation': 'En cours de rédaction'
  };

}
