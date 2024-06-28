export class Keycloak {
    issuer = '';
    realm = '';
    clientId = '';
    urlLogout!: '';
}

export class FileUpload {
    maxSingleFileSize = 0;
    maxTotalFileSize = 0;
    allowedFileType: ""
}

export class Settings {
    production = false;
    keycloak: Keycloak | undefined;
    urlmarqueblanche = "";
    apiUrl = "";
    opendataToolUrl = "";
    fileUpload: FileUpload | undefined;
}