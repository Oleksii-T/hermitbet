export type ModalCloseMethod =
    | 'button'
    | 'escape'
    | 'backdrop'
    | 'programmatic'
    | 'navigation';

type GtmEvents = {
    game_closed: {
        game_id: number;
        game_name: string;
        close_method: ModalCloseMethod;
    };
    cashier_closed: {
        cashier_tab: 'deposit' | 'withdraw';
        payment_method: string;
        close_method: ModalCloseMethod;
    };
};

/** Queue events even when the GTM container has not loaded yet. */
export function trackGtmEvent<Event extends keyof GtmEvents>(
    event: Event,
    properties: GtmEvents[Event],
): void {
    console.log('GTM Custom Event', event, properties);

    if (typeof window === 'undefined') return;

    (window.dataLayer ??= []).push({ ...properties, event });
}
