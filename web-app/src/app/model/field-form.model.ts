export interface Field {
    key: string;
    type: string;
    preg_match?: string;
    [prop: string]: any;
}

export interface Data {
    [key: string]: Field;
}
