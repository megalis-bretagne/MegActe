import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'meg-loading',
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  message = input<string>("Chargement en cours...")

}
