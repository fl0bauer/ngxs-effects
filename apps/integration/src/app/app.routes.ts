import { Route } from '@angular/router';
import { CounterPage } from './pages/counter.page';
import { provideEffects } from '@ngxs-labs/effects';
import { CounterEffects } from './states/counter/counter.effects';
import { provideStates } from '@ngxs/store';
import { CounterState } from './states/counter/counter.state';

export const appRoutes: Route[] = [
    {
        path: '',
        component: CounterPage,
        providers: [provideStates([CounterState]), provideEffects([CounterEffects])],
    },
];
