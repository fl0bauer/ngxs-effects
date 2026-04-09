import { Injectable } from '@angular/core';
import { Effect, EffectOn } from '@ngxs-labs/effects';
import { FailingAction, Increment, SetCount } from './counter.actions';

@Injectable()
export class CounterEffects {
    @Effect(Increment, EffectOn.Dispatch)
    onIncrementDispatched(action: Increment): void {
        console.log('Increment dispatched', action);
    }

    @Effect([Increment, SetCount], EffectOn.Success)
    onCountChangeSuccess(action: Increment | SetCount): void {
        console.log('Increment or SetCount succeeded', action);

        if (action instanceof SetCount) {
            const { payload } = action;
            console.log('SetCount payload:', payload);
        }
    }

    @Effect(FailingAction, EffectOn.Error)
    onFailingActionError(action: FailingAction, error: Error): void {
        console.error('FailingAction error:', action, error.message);
    }
}
