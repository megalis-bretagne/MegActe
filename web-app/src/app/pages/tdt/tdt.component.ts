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
    id_d: string[] | null = null;



    ngOnInit(): void {
        this._route.queryParams.subscribe(params => {
            this.id_e = params['id_e'];
            this.id_d = params['id_d'];
            //TODO récupérer les params nécessaire pour gérer les retour du TDT
        })
    }


    backToApplication() {
        //TODO verif tdt
        this._router.navigate(['/org', this.id_e]);
    }


}
