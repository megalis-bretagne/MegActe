import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { DocCreateInfo } from 'src/app/model/document.model';
import { DocumentService } from 'src/app/services/document.service';
import { SharedDataService } from 'src/app/services/sharedData.service';

@Component({
  selector: 'meg-document-list',
  standalone: true,
  imports: [],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  typeNom: string;

  constructor(private logger: NGXLogger, private route: ActivatedRoute, private router: Router, private sharedDataService: SharedDataService, private documentService: DocumentService) { }

  ngOnInit(): void {
    this.typeNom = this.route.snapshot.paramMap.get('typeNom');
  }


  createDoc(): void {
    this.typeNom = this.route.snapshot.paramMap.get('typeNom');

    const docCreateInfo: DocCreateInfo = {
      entite_id: this.sharedDataService.getUser().user_info.id_e,
      flux_type: this.sharedDataService.getFieldByName(this.typeNom),
      doc_info: {}
    };

    this.documentService.createDocument(docCreateInfo).subscribe(
      (response) => {
        const documentId = response.content.info.id_d;
        this.router.navigate(['/acte', this.typeNom, { documentId }]);
      },
      (error) => {
        this.logger.error('Error creating document:', error);
      }
    );
  }

}
