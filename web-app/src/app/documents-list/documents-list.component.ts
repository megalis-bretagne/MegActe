import { Component, ViewChild } from '@angular/core';
import { ApiClientService } from '../api-client.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface DocumentInfos {
  centre_de_gestion: string;
  creation: string;
  date_inscription: string;
  denomination: string;
  entite: string[];
  entite_base: string;
  entite_mere: string;
  etat: string;
  id_d: string;
  id_e: string;
  is_active: string;
  last_action: string;
  last_action_date: string;
  last_action_display: string;
  last_type: string;
  modification: string;
  role: string;
  siren: string;
  titre: string;
  type: string;
}



@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.css']
})
export class DocumentsListComponent {



  displayedColumns: string[] = ['id_d', 'titre', 'type', 'creation', 'actions'];

  dataSource = new MatTableDataSource<DocumentInfos>();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;

  constructor(
    private apiClient: ApiClientService
  ) { }


  loadDocuments(): void {
    this.apiClient.getDocuments().then((data: any) => {
      this.dataSource = new MatTableDataSource<DocumentInfos>(JSON.parse(JSON.stringify(data)));
      this.dataSource.paginator = this.paginator;
    })


  }

  editDocument(doc: DocumentInfos) {
    console.log(doc);
  }

}
