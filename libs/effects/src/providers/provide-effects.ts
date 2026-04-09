import {
    DestroyRef,
    EnvironmentProviders,
    inject,
    makeEnvironmentProviders,
    provideEnvironmentInitializer,
    Type,
} from '@angular/core';
import { ActionCompletion, Actions, ofActionCanceled, ofActionDispatched, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EffectOn } from '../enums/effect-on.enum';
import { EffectMetadata, EFFECTS_METADATA_KEY } from '../models/effect.model';

/** @internal Mapping from lifecycle event to NGXS operator. */
const OPERATOR_MAP = {
    [EffectOn.Dispatch]: ofActionDispatched,
    [EffectOn.Success]: ofActionSuccessful,
    [EffectOn.Error]: ofActionErrored,
    [EffectOn.Canceled]: ofActionCanceled,
} as const;

/**
 * Registers effect classes so they are instantiated when the environment
 * injector is created, and wires up all `@Effect()`-decorated methods
 * automatically. Use this in route-level or application-level providers —
 * just like `provideStates()` for NGXS state classes.
 *
 * Effect classes are **plain `@Injectable()` classes** — no base class required.
 * Just add `@Effect()` decorators to methods and register the class here.
 *
 * Effects are scoped to the injector they are registered in. When the injector
 * is destroyed (e.g. navigating away from a lazy-loaded route), all
 * subscriptions are automatically cleaned up via `takeUntilDestroyed()`.
 *
 * ## Usage
 *
 * ```ts
 * import { provideEffects } from '@ngxs-labs/effects';
 * import { provideStates } from '@ngxs/store';
 *
 * export const routes: Routes = [
 *     {
 *         path: '',
 *         component: PostsPage,
 *         providers: [
 *             provideStates([PostsState]),
 *             provideEffects([PostsEffects]),
 *         ],
 *     },
 * ];
 * ```
 *
 * @param effectClasses - An array of `@Injectable()` classes that use `@Effect()` decorators.
 * @returns An `EnvironmentProviders` token to include in the `providers` array.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function provideEffects(effectClasses: Type<any>[]): EnvironmentProviders {
    return makeEnvironmentProviders([
        ...effectClasses,
        ...effectClasses.map((effectClass) =>
            provideEnvironmentInitializer(() => {
                const instance = inject(effectClass);
                const actions$ = inject(Actions);
                const destroyRef = inject(DestroyRef);

                const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
                const metadata = (prototype[EFFECTS_METADATA_KEY] ?? []) as EffectMetadata[];

                for (const { actions, on, methodName } of metadata) {
                    for (const lifecycle of on) {
                        const operator = OPERATOR_MAP[lifecycle];

                        actions$.pipe(operator(...actions), takeUntilDestroyed(destroyRef)).subscribe((result) => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                            const method = (instance as Record<string, Function>)[methodName];
                            if (lifecycle === EffectOn.Error) {
                                const completion = result as ActionCompletion;
                                method.call(instance, completion.action, completion.result.error);
                            } else {
                                method.call(instance, result);
                            }
                        });
                    }
                }
            }),
        ),
    ]);
}
