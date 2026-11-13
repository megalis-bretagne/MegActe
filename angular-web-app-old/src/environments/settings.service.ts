import { Injectable } from '@angular/core';
import { Settings, Keycloak, FileUpload, FlowType } from './settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
    public settings: Settings;

    constructor() {
        this.settings = new Settings();
        this.settings.keycloak = new Keycloak();
        this.settings.fileUpload = new FileUpload();
        this.settings.flowType = new FlowType();
    }

    setSettings(settings: Settings): void {
        this.settings = settings;
        if (!this.settings.fileUpload) {
            this.settings.fileUpload = new FileUpload();
        }

        if (!this.settings.flowType) {
            this.settings.flowType = {
                ...new Settings().flowType
            };
        }
    }

    getSetting(): Settings {
        return this.settings;
    }

    public get apiUrl(): string {
        return this.settings.apiUrl;
    }

    public get opendataToolUrl(): string {
        return this.settings.opendataToolUrl;
    }

    public get urlmarqueblanche(): string {
        return this.settings.urlmarqueblanche;
    }

    public get maxSingleFileSize(): number {
        return this.settings.fileUpload.maxSingleFileSize;
    }

    public get maxTotalFileSize(): number {
        return this.settings.fileUpload.maxTotalFileSize;
    }

    public get defaultAllowedFileType(): string {
        return this.settings.fileUpload.allowedFileType.accept;
    }

    public get defaultAllowedMimeType(): string {
        return this.settings.fileUpload.allowedFileType['mime-type'];
    }

    public getFlowType(flowId: string): string[] | undefined {
        return this.settings.flowType[flowId];
    }

    public getMappingStatusDocument() {
        return this.settings.mappingStatusDocument;
    }

}