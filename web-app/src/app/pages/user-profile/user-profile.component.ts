import { Component, OnInit } from '@angular/core';
import { UserContext } from 'src/app/model/user.model';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userContext: UserContext;
  currentPage: number = 1;
  itemsPerPage: number = 15;
  paginatedEntities: any[] = [];
  totalPages: number = 0;
  displayedPages: number[] = [];

  constructor(private sharedDataService: SharedDataService) { }

  ngOnInit(): void {
    this.userContext = this.sharedDataService.getUser();
    this.updatePagination();
  }

  updatePagination() {
    if (!this.userContext) return;
    this.totalPages = Math.ceil(this.userContext.entites.length / this.itemsPerPage);
    this.updateDisplayedPages();
    this.paginate();
  }

  paginate() {
    if (!this.userContext) return;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEntities = this.userContext.entites.slice(start, end);
  }

  changePage(page: number, event: Event) {
    event.preventDefault();
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateDisplayedPages();
    this.paginate();
  }

  updateDisplayedPages() {
    const visiblePages = 5; // Nombre de pages à afficher
    let startPage = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + visiblePages - 1);

    // Ajuste startPage si on est à la fin
    if (endPage - startPage < visiblePages - 1) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }

    this.displayedPages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
}