import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LoadingDialogComponent } from '../components/loading-dialog/loading-dialog.component';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private dialogRef: any;

    constructor(private dialog: MatDialog) { }

    showLoading(message: string = 'Chargement ...') {
        this.dialogRef = this.dialog.open(LoadingDialogComponent, {
            data: { message: message, error: null },
            disableClose: true
        });
    }

    hideLoading() {
        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }

    showSuccess(success: string, redirect: string[] = null) {
        if (this.dialogRef) {
            this.dialogRef.componentInstance.success.set(success);
            this.dialogRef.componentInstance.error.set(null);
            this.dialogRef.componentInstance.redirect_on_close.set(redirect);
        } else {
            this.dialogRef = this.dialog.open(LoadingDialogComponent, {
                data: { message: '', success: success, redirect_on_close: redirect }
            });
        }
    }

    showError(error: string, redirect: string[] = null) {
        if (this.dialogRef) {
            this.dialogRef.componentInstance.success.set(null);
            this.dialogRef.componentInstance.error.set(error);
            this.dialogRef.componentInstance.redirect_on_close.set(redirect);
        } else {
            this.dialogRef = this.dialog.open(LoadingDialogComponent, {
                data: { message: '', error: error, redirect_on_close: redirect }
            });
        }
    }
}
