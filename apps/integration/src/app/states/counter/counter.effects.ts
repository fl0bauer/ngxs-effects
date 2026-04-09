import { Injectable } from '@angular/core';
import { Effect, EffectOn } from '@ngxs-labs/effects';
import { FailingAction, Increment } from './counter.actions';

@Injectable()
export class CounterEffects {
    @Effect(Increment, EffectOn.Dispatch)
    onIncrementDispatched(action: Increment): void {
        console.log('Increment dispatched', action);
    }

    @Effect(Increment, EffectOn.Success)
    onIncrementSuccess(action: Increment): void {
        console.log('Increment succeeded', action);
    }

    @Effect(FailingAction, EffectOn.Error)
    onFailingActionError(action: FailingAction, error: Error): void {
        console.error('FailingAction error:', action, error.message);
    }
}
