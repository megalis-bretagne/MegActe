import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { InfoModal, TypeModal } from '../model/modal.model';

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    private _status = signal<InfoModal | null>(null);
    status$ = toObservable(this._status);

    // Method to show the modal with a custom message
    showSuccess(message: string, redirect: string[] = null, callback: (result: any) => void = () => { }): void {
        this._status.set({ message: message, type: TypeModal.Success, redirect_on_close: redirect, callbackClose: callback } as InfoModal);
    }

    // Method to hide the modal
    hideLoading(): void {
        this._status.set(null);
    }

    showLoading(message: string = 'Chargement ...') {
        this._status.set({ message: message, type: TypeModal.Loading, redirect_on_close: null } as InfoModal);
    }

    showError(error: string, redirect: string[] = null, callback: (result: any) => void = () => { }) {
        this._status.set({ message: error, type: TypeModal.Error, redirect_on_close: redirect, callbackClose: callback } as InfoModal);
    }
}
