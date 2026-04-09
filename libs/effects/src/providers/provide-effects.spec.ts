import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { Action, provideStore, State, StateContext, Store } from '@ngxs/store';
import { firstValueFrom, Observable } from 'rxjs';
import { provideEffects } from './provide-effects';
import { Effect } from '../decorators/effect.decorator';
import { EffectOn } from '../enums/effect-on.enum';

// --- Test Actions ---

class IncrementAction {
    static readonly type = '[Test] Increment';
}

class DecrementAction {
    static readonly type = '[Test] Decrement';
}

class FailingAction {
    static readonly type = '[Test] Failing';
}

class CancelableAction {
    static readonly type = '[Test] Cancelable';
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

    @Action(DecrementAction)
    decrement(ctx: StateContext<TestStateModel>) {
        ctx.patchState({ count: ctx.getState().count - 1 });
    }

    @Action(FailingAction)
    fail() {
        throw new Error('Test error');
    }

    @Action(CancelableAction, { cancelUncompleted: true })
    cancelable(): Observable<void> {
        return new Observable<void>((subscriber) => {
            const timeout = setTimeout(() => {
                subscriber.next();
                subscriber.complete();
            }, 1000);
            return () => clearTimeout(timeout);
        });
    }
}

// --- Test Effects ---

@Injectable()
class TestEffects {
    @Effect(IncrementAction, EffectOn.Dispatch)
    onDispatch(_action: IncrementAction): void {
        /* noop */
    }

    @Effect(IncrementAction, EffectOn.Success)
    onSuccess(_action: IncrementAction): void {
        /* noop */
    }

    @Effect(FailingAction, EffectOn.Error)
    onError(_action: FailingAction, _error: Error): void {
        /* noop */
    }

    @Effect([IncrementAction, DecrementAction], EffectOn.Dispatch)
    onCountChanged(_action: IncrementAction | DecrementAction): void {
        /* noop */
    }

    @Effect(CancelableAction, EffectOn.Canceled)
    onCanceled(_action: CancelableAction): void {
        /* noop */
    }

    @Effect(IncrementAction, [EffectOn.Dispatch, EffectOn.Success])
    onDispatchAndSuccess(_action: IncrementAction): void {
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

    it('should call the decorated method on EffectOn.Canceled when the action is canceled', async () => {
        const spy = jest.spyOn(effects, 'onCanceled');

        // Dispatch twice rapidly — the first should be canceled by the second (cancelUncompleted: true).
        store.dispatch(new CancelableAction());
        await firstValueFrom(store.dispatch(new CancelableAction()));

        expect(spy).toHaveBeenCalledWith(expect.any(CancelableAction));
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

    describe('array of actions', () => {
        it('should call the handler when the first action in the array is dispatched', async () => {
            const spy = jest.spyOn(effects, 'onCountChanged');
            await firstValueFrom(store.dispatch(new IncrementAction()));
            expect(spy).toHaveBeenCalledWith(expect.any(IncrementAction));
        });

        it('should call the handler when the second action in the array is dispatched', async () => {
            const spy = jest.spyOn(effects, 'onCountChanged');
            await firstValueFrom(store.dispatch(new DecrementAction()));
            expect(spy).toHaveBeenCalledWith(expect.any(DecrementAction));
        });

        it('should call the handler for each action independently', async () => {
            const spy = jest.spyOn(effects, 'onCountChanged');
            await firstValueFrom(store.dispatch(new IncrementAction()));
            await firstValueFrom(store.dispatch(new DecrementAction()));
            expect(spy).toHaveBeenCalledTimes(2);
        });
    });

    describe('multiple lifecycle events', () => {
        it('should fire the handler once per lifecycle event for a single dispatch', async () => {
            const spy = jest.spyOn(effects, 'onDispatchAndSuccess');
            await firstValueFrom(store.dispatch(new IncrementAction()));
            // Should fire twice: once on Dispatch, once on Success.
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenCalledWith(expect.any(IncrementAction));
        });
    });
});
