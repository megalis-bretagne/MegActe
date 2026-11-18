export enum TypeModal {
    Info = 'INFO',
    Error = 'ERROR',
    Success = 'SUCCESS',
    Loading = 'LOADING'
}

export interface RedirectModal {
    route: string[] | null;
    params?: { [key: string]: string }
}

export interface InfoModal {
    message: string,
    type: TypeModal,
    redirect_on_close: RedirectModal | null,
    callbackClose: (result?: unknown) => void,
}