import { Component, Inject, signal } from '@angular/core';
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
    message = signal<string>("");
    error = signal<string | null>(null);
    success = signal<string | null>(null);
    redirect_on_close = signal<string[] | null>(null);

    constructor(
        public dialogRef: MatDialogRef<LoadingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
    ) {
        this.message.set(data.message);
        this.error.set(data.error || null);
        this.success.set(data.success || null);
        this.redirect_on_close.set(data.redirect_on_close || null);
    }

    onClose(): void {
        if (this.redirect_on_close()) {
            this.router.navigate(this.redirect_on_close());
        }
        this.dialogRef.close();
    }
}