import { Component, inject } from '@angular/core';
import { DocumentListComponent } from '../../shared/components/document-list/document-list.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DocumentListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

}
