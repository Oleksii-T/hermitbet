export type ModalCloseMethod =
    | 'button'
    | 'escape'
    | 'backdrop'
    | 'programmatic'
    | 'navigation';

export type LowFundsEventProperties = {
    game_id: number;
    game_name: string;
    demo_balance: number;
    bet_amount: number;
};

type GtmEvents = {
    low_funds_shown: LowFundsEventProperties;
    low_funds_closed: LowFundsEventProperties & {
        close_method: ModalCloseMethod | 'deposit';
    };
    low_funds_deposit_clicked: LowFundsEventProperties;
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
