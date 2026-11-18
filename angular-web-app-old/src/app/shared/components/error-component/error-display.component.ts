import { Component, computed, inject, input } from '@angular/core';
import { ErrorHandlerService } from 'src/app/core/services/error/error-handler.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
    selector: 'meg-error-display',
    template: `
    @if(errorMessage()) {
    <div class="flex items-center p-4 mb-4 meg-error border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
        <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        </svg>
        <span class="sr-only">Info</span>
        <div>
           {{ errorMessage() }}
        </div>
        @if(isClosable()) {
            <button  (click)="clearError()"  type="button" class="ms-auto -mx-1.5 -my-1.5 bg-red-50 text-alert rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700" data-dismiss-target="#alert-2" aria-label="Close">
                <span class="sr-only">Fermer le message d'erreur</span>
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
            </button>
        }
    </div>
    }
  `,
    standalone: true
})
export class ErrorDisplayComponent {
    private readonly _errorHandler = inject(ErrorHandlerService);
    private readonly _userService = inject(UserContextService);

    message = input<string | null>(null);
    closable = input<boolean | null>(null);


    errorMessage = computed(() => {
        if (this.message())
            return this.message();
        return this._errorHandler.error$();
    })

    isClosable = computed(() => {
        if (this._userService.userCurrent() === null)
            return false;

        if (this.closable() !== null)
            return this.closable();

        return this._errorHandler.isClosable$();
    })

    clearError() {
        this._errorHandler.clearError();
    }
}
