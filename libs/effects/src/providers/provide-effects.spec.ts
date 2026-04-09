import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { Action, provideStore, State, StateContext, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { provideEffects } from './provide-effects';
import { Effect } from '../decorators/effect.decorator';
import { EffectOn } from '../enums/effect-on.enum';

// --- Test Actions ---

class IncrementAction {
    static readonly type = '[Test] Increment';
}

class FailingAction {
    static readonly type = '[Test] Failing';
}

// --- Test State ---

interface TestStateModel {
    count: number;
}

@State<TestStateModel>({
    name: 'test',
    defaults: { count: 0 },
})
@Injectable()
class TestState {
    @Action(IncrementAction)
    increment(ctx: StateContext<TestStateModel>) {
        ctx.patchState({ count: ctx.getState().count + 1 });
    }

    @Action(FailingAction)
    fail() {
        throw new Error('Test error');
    }
}

// --- Test Effects ---

@Injectable()
class TestEffects {
    @Effect(IncrementAction, EffectOn.Dispatch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDispatch(_action: IncrementAction): void {
        /* noop */
    }

    @Effect(IncrementAction, EffectOn.Success)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess(_action: IncrementAction): void {
        /* noop */
    }

    @Effect(FailingAction, EffectOn.Error)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError(_action: FailingAction, _error: Error): void {
        /* noop */
    }
}

describe('provideEffects', () => {
    let store: Store;
    let effects: TestEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideStore([TestState]), provideEffects([TestEffects])],
        });

        store = TestBed.inject(Store);
        effects = TestBed.inject(TestEffects);
    });

    afterEach(() => {
        TestBed.resetTestingModule();
    });

    it('should return EnvironmentProviders', () => {
        const result = provideEffects([TestEffects]);
        expect(result).toBeDefined();
    });

    it('should call the decorated method on EffectOn.Success with the action instance as first param', async () => {
        const spy = jest.spyOn(effects, 'onSuccess');
        await firstValueFrom(store.dispatch(new IncrementAction()));
        expect(spy).toHaveBeenCalledWith(expect.any(IncrementAction));
    });

    it('should call the decorated method on EffectOn.Dispatch with the action instance as first param', async () => {
        const spy = jest.spyOn(effects, 'onDispatch');
        await firstValueFrom(store.dispatch(new IncrementAction()));
        expect(spy).toHaveBeenCalledWith(expect.any(IncrementAction));
    });

    it('should call the decorated method on EffectOn.Error with the action as first param and error as second', async () => {
        const spy = jest.spyOn(effects, 'onError');
        try {
            await firstValueFrom(store.dispatch(new FailingAction()));
        } catch {
            // Expected — the action throws
        }
        expect(spy).toHaveBeenCalledWith(expect.any(FailingAction), expect.any(Error));
        expect(spy).toHaveBeenCalledWith(
            expect.any(FailingAction),
            expect.objectContaining({ message: 'Test error' }),
        );
    });

    it('should clean up subscriptions when the injector is destroyed', async () => {
        const spy = jest.spyOn(effects, 'onSuccess');
        spy.mockClear();

        TestBed.resetTestingModule();

        // After destroying, dispatching should not call the effect anymore.
        // Re-create a minimal store to dispatch, but the old effect should not fire.
        TestBed.configureTestingModule({
            providers: [provideStore([TestState])],
        });

        const newStore = TestBed.inject(Store);
        await firstValueFrom(newStore.dispatch(new IncrementAction()));

        expect(spy).not.toHaveBeenCalled();
    });
});
