import { Component, Inject } from '@angular/core';
import {
    MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingComponent } from '../loading-component/loading.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-loading-dialog',
    standalone: true,
    imports: [MatDialogModule, MatProgressSpinnerModule, MatButtonModule, LoadingComponent],
    templateUrl: './loading-dialog.component.html',
    styleUrls: ['./loading-dialog.component.scss']
})
export class LoadingDialogComponent {
    message: string;
    error: string | null;
    success: string | null;
    redirect_on_close: string[] | null;

    constructor(
        public dialogRef: MatDialogRef<LoadingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
    ) {
        this.message = data.message;
        this.error = data.error || null;
        this.success = data.success || null;
        this.redirect_on_close = data.redirect_on_close || null;
    }

    onClose(): void {
        if (this.redirect_on_close) {
            this.router.navigate(this.redirect_on_close);
        }
        this.dialogRef.close();
    }
}