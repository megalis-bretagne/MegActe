import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    private readonly _errorSignal = signal<string | null>(null); // Signal pour contenir les messages d'erreur
    private readonly _isClosableSignal = signal<boolean>(true);

    public error$ = this._errorSignal.asReadonly(); // Lire uniquement depuis l'extérieur
    public isClosable$ = this._isClosableSignal.asReadonly();


    showError(error: string, closable = true) {
        this._errorSignal.set(error);
        this._isClosableSignal.set(closable);
    }

    clearError() {
        this._errorSignal.set(null);
        this._isClosableSignal.set(true);
    }
}
