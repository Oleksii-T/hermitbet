export type Provider = {
    id: number;
    name: string;
    slug: string;
    symbol: string;
    games_count: number;
};
export type Game = {
    id: number;
    name: string;
    slug: string;
    category: string;
    tags: string[];
    image: string;
    color: string;
    is_popular: boolean;
    is_featured: boolean;
    popularity: number;
    provider: Provider;
};
export type Tournament = {
    id: number;
    name: string;
    description: string;
    image: string;
    prize_pool: number;
    starts_at: string;
    ends_at: string;
};
export type Transaction = {
    id: number;
    type: string;
    description: string;
    amount: number;
    balance_after: number;
    created_at: string;
};
export function credits(amount: number): string {
    return (amount / 100).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
export function artStyle(image: string): Record<string, string> {
    const tile = Number(image);
    return {
        backgroundImage: 'url(/images/game-atlas.png)',
        backgroundSize: '400% 300%',
        backgroundPosition: `${((tile % 4) * 100) / 3}% ${Math.floor(tile / 4) * 50}%`,
    };
}
