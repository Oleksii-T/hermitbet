export type GameCloseMethod =
    | 'button'
    | 'escape'
    | 'backdrop'
    | 'programmatic'
    | 'navigation';

type GtmEvents = {
    game_closed: {
        game_id: number;
        game_name: string;
        close_method: GameCloseMethod;
    };
};

/** Queue events even when the GTM container has not loaded yet. */
export function trackGtmEvent<Event extends keyof GtmEvents>(
    event: Event,
    properties: GtmEvents[Event],
): void {
    if (typeof window === 'undefined') return;

    (window.dataLayer ??= []).push({ ...properties, event });
}
