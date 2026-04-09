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
            actions: [TestAction],
            on: [EffectOn.Success],
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

    it('should default `on` to [EffectOn.Success] when omitted', () => {
        class TestEffects {
            @Effect(TestAction)
            onSuccess(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata[0].on).toEqual([EffectOn.Success]);
    });

    it('should normalize a single EffectOn value to a one-element array', () => {
        class TestEffects {
            @Effect(TestAction, EffectOn.Dispatch)
            onDispatch(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata[0].on).toEqual([EffectOn.Dispatch]);
    });

    it('should contain the correct actions, on, and methodName', () => {
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
            actions: [TestAction],
            on: [EffectOn.Dispatch],
            methodName: 'handleDispatch',
        });

        expect(metadata[1]).toEqual({
            actions: [AnotherAction],
            on: [EffectOn.Error],
            methodName: 'handleError',
        });
    });

    it('should support the EffectOn.Canceled lifecycle', () => {
        class TestEffects {
            @Effect(TestAction, EffectOn.Canceled)
            onCanceled(_action: TestAction) {
                /* noop */
            }
        }

        const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
        expect(metadata[0]).toEqual({
            actions: [TestAction],
            on: [EffectOn.Canceled],
            methodName: 'onCanceled',
        });
    });

    describe('multiple lifecycle events', () => {
        it('should store an array of EffectOn values when an array is passed', () => {
            class TestEffects {
                @Effect(TestAction, [EffectOn.Dispatch, EffectOn.Success])
                onDispatchOrSuccess(_action: TestAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata[0]).toEqual({
                actions: [TestAction],
                on: [EffectOn.Dispatch, EffectOn.Success],
                methodName: 'onDispatchOrSuccess',
            });
        });

        it('should support combining all lifecycle events', () => {
            class TestEffects {
                @Effect(TestAction, [EffectOn.Dispatch, EffectOn.Success, EffectOn.Error, EffectOn.Canceled])
                onAny(_action: TestAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata[0].on).toEqual([EffectOn.Dispatch, EffectOn.Success, EffectOn.Error, EffectOn.Canceled]);
        });

        it('should support multiple lifecycle events combined with an array of actions', () => {
            class TestEffects {
                @Effect([TestAction, AnotherAction], [EffectOn.Dispatch, EffectOn.Success])
                onEither(_action: TestAction | AnotherAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata[0]).toEqual({
                actions: [TestAction, AnotherAction],
                on: [EffectOn.Dispatch, EffectOn.Success],
                methodName: 'onEither',
            });
        });
    });

    describe('array of actions', () => {
        it('should store an array of action classes when an array is passed', () => {
            class TestEffects {
                @Effect([TestAction, AnotherAction], EffectOn.Success)
                onEither(_action: TestAction | AnotherAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata).toBeDefined();
            expect(metadata.length).toBe(1);
            expect(metadata[0]).toEqual({
                actions: [TestAction, AnotherAction],
                on: [EffectOn.Success],
                methodName: 'onEither',
            });
        });

        it('should default `on` to [EffectOn.Success] when an array is passed without a lifecycle', () => {
            class TestEffects {
                @Effect([TestAction, AnotherAction])
                onEither(_action: TestAction | AnotherAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata[0].on).toEqual([EffectOn.Success]);
        });

        it('should accumulate metadata when mixing single-action and array-action decorators', () => {
            class TestEffects {
                @Effect(TestAction, EffectOn.Dispatch)
                onSingle(_action: TestAction) {
                    /* noop */
                }

                @Effect([TestAction, AnotherAction], EffectOn.Success)
                onMultiple(_action: TestAction | AnotherAction) {
                    /* noop */
                }
            }

            const metadata = (TestEffects.prototype as Record<string, unknown>)[EFFECTS_METADATA_KEY] as EffectMetadata[];
            expect(metadata.length).toBe(2);

            expect(metadata[0]).toEqual({
                actions: [TestAction],
                on: [EffectOn.Dispatch],
                methodName: 'onSingle',
            });

            expect(metadata[1]).toEqual({
                actions: [TestAction, AnotherAction],
                on: [EffectOn.Success],
                methodName: 'onMultiple',
            });
        });
    });
});
