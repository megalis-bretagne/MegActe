import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { LoadingTemplateComponent } from 'src/app/components/loading-template/loading-template.component';
import { PaginationComponent } from 'src/app/components/pagination/pagination.component';
import { UserContextService } from 'src/app/services/user-context.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    LoadingTemplateComponent,
    CommonModule,
    PaginationComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  currentUser = inject(UserContextService).userCurrent;

  //calculé en fonction du nombre d'entité de l'utilsateur
  totalPages = computed(() => {
    if (this.currentUser() != null) {
      return Math.ceil(this.currentUser().entites.length / this.itemsPerPage);
    }
    return 0;
  });

  itemsPerPage: number = 5;
  paginatedEntities: any[] = [];


  constructor() {
    this.paginatedEntities = this.currentUser().entites.slice(1, this.itemsPerPage);
  }


  updateDisplayedPages(newPage: number) {
    const start = (newPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEntities = this.currentUser().entites.slice(start, end);
  }
}
