import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { CounterStateModel } from './counter.model';
import { FailingAction, Increment } from './counter.actions';

@State<CounterStateModel>({
    name: 'counter',
    defaults: {
        count: 0,
    },
})
@Injectable()
export class CounterState {
    @Selector()
    static count(state: CounterStateModel): number {
        return state.count;
    }

    @Action(Increment)
    increment(context: StateContext<CounterStateModel>): void {
        const count = context.getState().count + 1;
        context.patchState({ count });
    }

    @Action(FailingAction)
    fail(): void {
        throw new Error('This action intentionally fails!');
    }
}
