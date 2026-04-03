import { Component } from '@angular/core';
import { dispatch, select } from '@ngxs/store';
import { CounterState } from '../states/counter/counter.state';
import { FailingAction, Increment } from '../states/counter/counter.actions';

@Component({
    template: `
        <h2>Counter: {{ count() }}</h2>
        <p>Open the Console to see the Logs</p>
        <button (click)="increment()">Increment</button>
        <button (click)="failingAction()">Failing Action</button>
    `,
})
export class CounterPage {
    protected readonly count = select(CounterState.count);

    protected readonly increment = dispatch(Increment);
    protected readonly failingAction = dispatch(FailingAction);
}
