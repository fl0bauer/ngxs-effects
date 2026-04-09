import { ActionDef, ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';

/** @internal Metadata stored per decorated method. */
export interface EffectMetadata {
    actions: ActionType[];
    on: EffectOn;
    methodName: string;
}

/**
 * Extracts the instance (payload) type from an action class or array of action classes.
 *
 * - Single action: `InstanceType<T>`
 * - Array of actions: union of all `InstanceType<T[number]>`
 */
export type ExtractActionType<T extends ActionDef | ActionDef[]> = T extends ActionDef[]
    ? InstanceType<T[number]>
    : T extends ActionDef
      ? InstanceType<T>
      : never;

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
