import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Modal } from 'flowbite';
import { InfoModal, TypeModal } from 'src/app/core/model/modal.model';
import { LoadingService } from 'src/app/core/services/loading.service';
import { LoadingComponent } from '../loading-component/loading.component';


@Component({
    selector: 'meg-modal-dialog',
    standalone: true,
    imports: [LoadingComponent],
    templateUrl: './meg-modal-dialog.component.html',
    styleUrls: ['./meg-modal-dialog.component.scss']
})
export class ModalDialogComponent implements OnInit {
    private readonly _loadingService = inject(LoadingService);

    private _modal: Modal | undefined;
    status = signal<InfoModal | null>(null);

    cssClassType = signal<string>("");

    constructor(
        private readonly _router: Router,
    ) {

        effect(() => {
            if (this.status()) {
                this._setClassElement();
                this.openModal();
            } else {
                this.closeModal();
            }
        }, { allowSignalWrites: true })
    }


    _setClassElement() {
        switch (this.status().type) {
            case TypeModal.Error: { this.cssClassType.set("alert"); break; }
            case TypeModal.Info: { this.cssClassType.set("info"); break; }
            default: { this.cssClassType.set("success"); break; }
        }
    }

    ngOnInit(): void {
        // Get the modal element
        const modalElement = document.getElementById('successModal');

        // Initialize the Flowbite modal instance
        if (modalElement) {
            this._modal = new Modal(modalElement, { backdrop: 'static' });
        }
        this._loadingService.status$.subscribe(
            (status: InfoModal | null) => this.status.set(status)
        );
    }

    openModal(): void {
        if (this._modal) {
            this._modal.show();  // Show the modal
        }
    }

    closeModal(): void {
        if (this._modal) {
            this._modal.hide();
        }
        if (this.status()?.callbackClose) {
            this.status().callbackClose();
        }

        if (this.status()?.redirect_on_close) {
            const extras = this.status().redirect_on_close.params ? { queryParams: this.status().redirect_on_close.params } : {};
            this._router.navigate(this.status().redirect_on_close.route, extras);
        }
    }
}