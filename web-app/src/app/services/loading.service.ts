import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { InfoModal, TypeModal } from '../model/modal.model';

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    private status = signal<InfoModal | null>(null);
    status$ = toObservable(this.status);

    constructor() { }

    // Method to show the modal with a custom message
    showSuccess(message: string, redirect: string[] = null): void {
        this.status.set({ message: message, type: TypeModal.Success, redirect_on_close: redirect } as InfoModal);
    }

    // Method to hide the modal
    hideLoading(): void {
        this.status.set(null);
    }

    showLoading(message: string = 'Chargement ...') {
        this.status.set({ message: message, type: TypeModal.Loading, redirect_on_close: null } as InfoModal);
    }


    showError(error: string, redirect: string[] = null) {
        this.status.set({ message: error, type: TypeModal.Error, redirect_on_close: redirect } as InfoModal);
    }
}
