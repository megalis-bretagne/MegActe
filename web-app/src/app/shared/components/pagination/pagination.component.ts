import { Component, computed, output, input, signal, effect, untracked } from '@angular/core';

@Component({
  selector: 'meg-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {

  totalPages = input.required<number>();
  pageActive = input.required<number>();
  pagesToShow: number = 7;

  onChangePage = output<number>()

  currentPage = signal<number>(0);


  pagesToDisplay = computed(() => {
    const pages: number[] = [];
    const totalPage = untracked(this.totalPages);

    let startPage = Math.max(2, this.currentPage() - 3);
    let endPage = Math.min(totalPage - 1, this.currentPage() + 3);

    if (this.currentPage() <= 4) {
      endPage = Math.min(this.pagesToShow, totalPage - 1);
    }

    if (this.currentPage() > totalPage - 4) {
      startPage = Math.max(2, totalPage - this.pagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  })

  constructor() {
    effect(() => {
      if (this.pageActive() > 0)
        this.currentPage.set(this.pageActive())
    }, { allowSignalWrites: true })
  }

  /**
 * Controle le changement de page de la pagination
 * @param page 
 * @param event 
 */
  changePage(page: number, event: Event = null) {
    if (event != null)
      event.preventDefault();

    if (page === this.currentPage()) return;

    if (page < 1 || page > this.totalPages()) this.currentPage.set(1);
    this.currentPage.set(page);
    this.onChangePage.emit(page);
  }

}
