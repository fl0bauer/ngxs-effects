import { Effect } from './effect.decorator';
import { EffectOn } from '../enums/effect-on.enum';
import { EffectMetadata, EFFECTS_METADATA_KEY } from '../models/effect.model';

class TestAction {
    static readonly type = '[Test] Action';
}

class AnotherAction {
    static readonly type = '[Test] Another Action';
}

describe('Effect decorator', () => {
    it('should store metadata on the class prototype under EFFECTS_METADATA_KEY', () => {
        class TestEffects {
            @Effect(TestAction, EffectOn.Success)
            onSuccess(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata).toBeDefined();
        expect(metadata.length).toBe(1);
        expect(metadata[0]).toEqual({
            action: TestAction,
            on: EffectOn.Success,
            methodName: 'onSuccess',
        });
    });

    it('should accumulate metadata for multiple @Effect() decorators on different methods', () => {
        class TestEffects {
            @Effect(TestAction, EffectOn.Success)
            onSuccess(_action: TestAction) {
                /* noop */
            }

            @Effect(AnotherAction, EffectOn.Error)
            onError(_action: AnotherAction, _error: Error) {
                /* noop */
            }

            @Effect(TestAction, EffectOn.Dispatch)
            onDispatch(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata).toBeDefined();
        expect(metadata.length).toBe(3);
    });

    it('should default `on` to EffectOn.Success when omitted', () => {
        class TestEffects {
            @Effect(TestAction)
            onSuccess(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata[0].on).toBe(EffectOn.Success);
    });

    it('should contain the correct action, on, and methodName', () => {
        class TestEffects {
            @Effect(TestAction, EffectOn.Dispatch)
            handleDispatch(_action: TestAction) {
                /* noop */
            }

            @Effect(AnotherAction, EffectOn.Error)
            handleError(_action: AnotherAction, _error: Error) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];

        expect(metadata[0]).toEqual({
            action: TestAction,
            on: EffectOn.Dispatch,
            methodName: 'handleDispatch',
        });

        expect(metadata[1]).toEqual({
            action: AnotherAction,
            on: EffectOn.Error,
            methodName: 'handleError',
        });
    });
});
