export enum TypeModal {
    Info = 'INFO',
    Error = 'ERROR',
    Success = 'SUCCESS',
    Loading = 'LOADING'
}

export interface InfoModal {
    message: string,
    type: TypeModal,
    redirect_on_close: string[] | null,
}