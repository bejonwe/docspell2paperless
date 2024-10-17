export interface Metadata {
    id: string;
    name: string;
    state: string;
    date: Date;
    due_date: Date | null;
    source: string;
    direction: string;
    corr_org: Organisation;
    corr_person: null;
    conc_person: null;
    conc_equip: null;
    folder: Folder;
    attachments: Attachment[];
    tags: Tag[];
    customfields: never[];
    notes: string | null;
    highlighting: never[];
}
export interface Organisation {
    id: string;
    name: string;
}
export  interface Folder {
    id: string;
    name: string;
}
export interface Attachment {
    id: string;
    position: number;
    name: string;
    page_count: number;
}
export interface Tag {
    id: string;
    name: string;
    category: string;
    created: number;
}
