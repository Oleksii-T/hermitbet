# GTM custom events

`resources/js/lib/gtm.ts` is the shared event service. Add event names and their
property types to `GtmEvents`, then call `trackGtmEvent(name, properties)` from
the feature that owns the interaction. It preserves `window.dataLayer` and
queues events if GTM has not loaded. Server rendering is a no-op.

## Game modal closure

`CasinoModals.vue` pushes one `game_closed` event after the game dialog closes
or is replaced by another modal. It also records a game view removed by Vue
navigation/component unmounting. Other modal closures and attempts blocked
during a spin do not emit this event.

| Property       | Meaning                                                         |
| -------------- | --------------------------------------------------------------- |
| `game_id`      | Catalog game ID                                                 |
| `game_name`    | Catalog game name                                               |
| `close_method` | `button`, `escape`, `backdrop`, `programmatic`, or `navigation` |

`navigation` refers to Vue component unmounting, not a browser/tab close.
Delivery on a full browser unload is not guaranteed.

## Cashier modal closure

The cashier emits one `cashier_closed` event using the same closure methods
as the game modal. Attempts blocked while a deposit or withdrawal is processing
do not emit an event. Both cashier tabs use the same event name.

| Property         | Meaning                                                         |
| ---------------- | --------------------------------------------------------------- |
| `cashier_tab`    | `deposit` or `withdraw` at closure                              |
| `payment_method` | Selected deposit method: `card`, `bank`, `apple`, or `crypto`   |
| `close_method`   | `button`, `escape`, `backdrop`, `programmatic`, or `navigation` |

On the withdrawal tab, `payment_method` retains the selected deposit method;
it is not a withdrawal provider.

## Deposit method click selectors

Each payment method button has a stable GTM class:

| Method        | Class                |
| ------------- | -------------------- |
| Bank card     | `gtm-deposit-card`   |
| Bank transfer | `gtm-deposit-bank`   |
| Apple Pay     | `gtm-deposit-apple`  |
| Crypto        | `gtm-deposit-crypto` |

For example, configure a **Click – All Elements → Some Clicks** trigger with
**Click Element → matches CSS selector → `.gtm-deposit-card, .gtm-deposit-card *`**.
The second selector includes clicks on icons and text inside the button.

## Configure the GTM dashboard

1. Create **Triggers → New → Custom Event**. Set the event name to exactly
   `game_closed`, leave regex matching off, and select **All Custom Events**.
2. Attach this trigger to a **PostHog → Capture event** tag from the official
   PostHog web template. Set its event name to `game_closed`. Keep the existing
   PostHog initialization tag.
3. For event properties, create three **Data Layer Variables** (version 2):
   `game_id`, `game_name`, and `close_method`. Map them to properties with the
   same names in the capture tag.
4. Leave the event tag's firing option at **Once per event**, so reopening and
   closing a game can emit another event. Disable any older game-close click
   tag if it would send the same event.
5. In **Preview**, open and close a game using X, Escape, and a backdrop click.
   Confirm one `game_closed` data-layer event and one capture tag execution per
   closure. Close another modal and confirm no game event. Then publish the
   container using **Submit → Publish and Create Version**.

Pushing to the data layer does not automatically send an event to PostHog:
the trigger and capture tag above must be configured in each relevant container.

Repeat this setup for `cashier_closed`, mapping `cashier_tab`, `payment_method`,
and `close_method` as Data Layer Variables/event properties.

References: [GTM custom event triggers](https://support.google.com/tagmanager/answer/7679219?hl=en),
[PostHog GTM integration](https://posthog.com/docs/libraries/google-tag-manager).
