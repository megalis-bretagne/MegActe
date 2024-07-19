import { Component } from '@angular/core';
import { DocumentListComponent } from '../../components/document-list/document-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DocumentListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {


}
