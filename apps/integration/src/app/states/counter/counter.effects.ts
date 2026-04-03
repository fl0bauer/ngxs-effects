import { Injectable } from '@angular/core';
import { Effect, EffectOn } from '@ngxs-labs/effects';
import { Increment, FailingAction } from './counter.actions';

@Injectable()
export class CounterEffects {
    @Effect(Increment, EffectOn.Dispatch)
    onIncrementDispatched(): void {
        console.log('Increment dispatched');
    }

    @Effect(Increment, EffectOn.Success)
    onIncrementSuccess(): void {
        console.log('Increment succeeded');
    }

    @Effect(FailingAction, EffectOn.Error)
    onFailingActionError(error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        console.error('FailingAction error:', message);
    }
}
