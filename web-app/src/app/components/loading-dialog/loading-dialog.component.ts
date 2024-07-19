import { Component, Inject } from '@angular/core';
import {
    MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingComponent } from '../loading-component/loading.component';




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

    constructor(
        public dialogRef: MatDialogRef<LoadingDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.message = data.message;
        this.error = data.error;
    }

    onClose(): void {
        this.dialogRef.close();
    }
}