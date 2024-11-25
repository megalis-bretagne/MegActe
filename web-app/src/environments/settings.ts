export class Keycloak {
    issuer = '';
    realm = '';
    clientId = '';
    urlLogout!: '';
}

export class FileUpload {
    maxSingleFileSize = 1 * 1024 * 1024; // 1 Mo
    maxTotalFileSize = 10 * 1024 * 1024; // 10 Mo
    allowedFileType = { accept: ".pdf, .doc, .docx, .odt", "mime-type": "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.oasis.opendocument.text" }
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
    pastellUrl = "";
    fileUpload: FileUpload = new FileUpload();
    flowType: FlowType = {
        'deliberations-studio': ['document_papier', 'autre_document_attache', 'publication_open_data'],
        'acte-generique': ['document_papier']
    };
    mappingStatusDocument: { [key: string]: string } = {}
}