import { Component, input } from '@angular/core';

@Component({
  selector: 'meg-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  styleUrls: []
})
export class LoadingComponent {
  message = input<string>("Chargement en cours...")
}
