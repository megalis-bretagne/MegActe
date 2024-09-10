import { HttpErrorResponse } from "@angular/common/http";


export interface ErrorDetail {
    detail: string;
}

export interface HttpErrorCustom extends HttpErrorResponse {
    error: ErrorDetail;
}