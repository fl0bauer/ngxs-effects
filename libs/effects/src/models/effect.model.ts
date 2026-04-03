import { ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';

/** @internal Metadata stored per decorated method. */
export interface EffectMetadata {
    action: ActionType;
    on: EffectOn;
    methodName: string;
}

/** @internal Key used to store effect metadata on the class prototype. */
export const EFFECTS_METADATA_KEY = '__ngxs_effects__';
