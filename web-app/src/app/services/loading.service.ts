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

    showError(error: string) {
        if (this.dialogRef) {
            this.dialogRef.componentInstance.error = error;
        } else {
            this.dialogRef = this.dialog.open(LoadingDialogComponent, {
                data: { message: '', error: error }
            });
        }
    }
}
