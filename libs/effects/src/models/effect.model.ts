import { ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';

/** @internal Metadata stored per decorated method. */
export interface EffectMetadata {
    action: ActionType;
    on: EffectOn;
    methodName: string;
}

/**
 * Allowed method signatures for an `@Effect()`-decorated method.
 *
 * The action instance `A` is always the first parameter.
 * For `EffectOn.Error` the `Error` is passed as the second parameter.
 * All parameters may be omitted if not needed.
 */
export type EffectMethodDescriptor<A> =
    | TypedPropertyDescriptor<() => void>
    | TypedPropertyDescriptor<(action: A) => void>
    | TypedPropertyDescriptor<(action: A, error: Error) => void>;

/** @internal Key used to store effect metadata on the class prototype. */
export const EFFECTS_METADATA_KEY = '__ngxs_effects__';
