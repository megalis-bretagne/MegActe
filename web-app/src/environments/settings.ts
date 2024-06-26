export class Keycloak {
    issuer = '';
    realm = '';
    clientId = '';
    urlLogout!: '';
}

export class FileUpload {
    maxSingleFileSize = 1 * 1024 * 1024; // 1 Mo
    maxTotalFileSize = 10 * 1024 * 1024; // 10 Mo
    allowedFileType: "application/pdf"
}

export class Settings {
    production = false;
    keycloak: Keycloak | undefined;
    urlmarqueblanche = "";
    apiUrl = "";
    opendataToolUrl = "";
    fileUpload: FileUpload = new FileUpload();
}