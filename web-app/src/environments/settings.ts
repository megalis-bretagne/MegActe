export class Keycloak {
    issuer = '';
    realm = '';
    clientId = '';
    urlLogout!: '';
}

export class FileUpload {
    maxSingleFileSize = 1 * 1024 * 1024; // 1 Mo
    maxTotalFileSize = 10 * 1024 * 1024; // 10 Mo
    allowedFileType = "application/pdf";
}

export class FlowType {
    [flowType: string]: string[];
}

export class Settings {
    production = false;
    keycloak: Keycloak | undefined;
    urlmarqueblanche = "";
    apiUrl = "";
    opendataToolUrl = "";
    fileUpload: FileUpload = new FileUpload();
    flowType: FlowType = {
        'deliberations-studio': ['document_papier', 'autre_document_attache', 'publication_open_data'],
        'acte-generique': ['document_papier']
    };
}