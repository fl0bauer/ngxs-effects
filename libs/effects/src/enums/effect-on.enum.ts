/**
 * Lifecycle event to react to when an NGXS action is processed.
 *
 * Use with the `@Effect()` decorator to specify **when** the side effect should run.
 */
export enum EffectOn {
    /** Runs when the action is dispatched (before the state handler executes). */
    Dispatch = 'dispatch',

    /** Runs after the action handler completes successfully. */
    Success = 'success',

    /** Runs when the action handler throws an error. */
    Error = 'error',

    /** Runs when the action is canceled (e.g. by a newer dispatch of the same action). */
    Canceled = 'canceled',
}
