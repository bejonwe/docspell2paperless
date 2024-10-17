export interface CorrespondentResult {
    count: number;
    next: string | null;
    previous: string | null;
    all: number[];
    results: Correspondent[];
}
export interface Correspondent {
    id: number;
    slug: string;
    name: string;
    match: string;
    matching_algorithm: number;
    is_insensitive: boolean;
    document_count: number;
    owner: null;
    user_can_change: boolean;
}

export interface TagResult {
    count: number;
    next: string | null;
    previous: string | null;
    all: number[];
    results: Tag[];
}
export interface Tag {
    id: number;
    slug: string;
    name: string;
    colour: number;
    match: string;
    matching_algorithm: number;
    is_insensitive: boolean;
    is_inbox_tag: boolean;
    document_count: number;
    owner: null;
    user_can_change: boolean;
}

export interface DocumentTypeResult {
    count: number;
    next: string | null;
    previous: string | null;
    all: number[];
    results: DocumentType[];
}
export interface DocumentType {
    id: number;
    slug: string;
    name: string;
    match: string;
    matching_algorithm: number;
    is_insensitive: boolean;
    document_count: number;
    owner: null;
    user_can_change: boolean;
}
    