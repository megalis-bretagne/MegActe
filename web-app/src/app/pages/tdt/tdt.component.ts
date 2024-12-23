import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from 'src/app/core/services/document.service';


@Component({
    selector: 'meg-tdt',
    standalone: true,
    imports: [],
    templateUrl: './tdt.component.html',
})
export class TdtComponent implements OnInit {

    private readonly _documentservice = inject(DocumentService);
    private readonly _route = inject(ActivatedRoute);
    private readonly _router = inject(Router);


    id_e: number | null = null;
    id_d: string[] = [];
    error: number | null = null;
    message: string = "";



    ngOnInit(): void {
        this._route.queryParams.subscribe(params => {
            this.id_e = params['id_e'];
            if (params['id_d']) {
                this.id_d = [params['id_d']]
            } else if (params['id_d[]']) {
                this.id_d = params['id_d[]'];
            }

            this.error = params['error'] ?? 0;
            this.message = params['message'];
            if (this.error < 1) {
                this._documentservice.retourTdtWithDelay(this.id_e, this.id_d);
            }
        })
    }


    backToDocument() {
        this._router.navigate(['/org', this.id_e])
    }
}
