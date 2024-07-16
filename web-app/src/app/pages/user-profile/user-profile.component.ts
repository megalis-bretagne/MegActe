import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { LoadingTemplateComponent } from 'src/app/components/loading-template/loading-template.component';
import { UserContextService } from 'src/app/services/user-context.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    LoadingTemplateComponent,
    CommonModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  currentUser = inject(UserContextService).userCurrent;

  currentPage = signal(1);

  //calculé en fonction du nombre d'entité de l'utilsateur
  totalPages = computed(() => {
    if (this.currentUser() != null) {
      return Math.ceil(this.currentUser().entites.length / this.itemsPerPage);
    }
    return 0;
  });

  itemsPerPage: number = 15;
  paginatedEntities: any[] = [];
  displayedPages: number[] = [];
  visiblePages = 5;


  constructor() {
    effect(() => {
      const currentPage = this.currentPage();
      const totalPage = this.totalPages();
      if (totalPage > 0) {
        this.updateDisplayedPages(currentPage, totalPage);
      }
    })
  }

  changePage(page: number, event: Event) {
    event.preventDefault();
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  updateDisplayedPages(newPage: number, totalPage: number) {
    const start = (newPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEntities = this.currentUser().entites.slice(start, end);

    let startPage = Math.max(1, newPage - Math.floor(this.visiblePages / 2));
    const endPage = Math.min(totalPage, startPage + this.visiblePages - 1);

    this.displayedPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
}
