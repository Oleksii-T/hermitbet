export type User = {
    id: number;
    name: string;
    username: string;
    phone: string;
    birth_date: string;
    balance: number;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};
