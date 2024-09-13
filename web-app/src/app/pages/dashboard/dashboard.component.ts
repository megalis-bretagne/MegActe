import { Component } from '@angular/core';
import { DocumentListComponent } from '../../components/document-list/document-list.component';
import { EntiteSelectComponent } from 'src/app/components/entite-select/entite-select.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DocumentListComponent, EntiteSelectComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {


}
