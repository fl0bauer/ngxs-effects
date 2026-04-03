import { ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';
import { EffectMetadata, EFFECTS_METADATA_KEY } from '../models/effect.model';

/**
 * Method decorator that marks a method as an NGXS action side effect.
 *
 * Works exactly like `@Action()` in NGXS state classes, but for side effects
 * that should **not** live in the state handler (navigation, toasts, logging, etc.).
 *
 * - `EffectOn.Success` (default) — the method receives the **action instance** after the handler completes.
 * - `EffectOn.Error` — the method receives the **error** that caused the failure.
 * - `EffectOn.Dispatch` — the method receives the **action instance** when it is dispatched (before the handler runs).
 *
 * ## Usage
 *
 * ```ts
 * @Injectable()
 * export class PostEffects {
 *     private readonly router = inject(Router);
 *
 *     @Effect(CreatePost, EffectOn.Success)
 *     onCreatePostSuccess() {
 *         this.router.navigate(['/posts']);
 *     }
 *
 *     @Effect(CreatePost, EffectOn.Error)
 *     onCreatePostError(error: unknown) {
 *         if (error instanceof HttpErrorResponse && error.status === 404) {
 *             this.router.navigate(['/404']);
 *         }
 *     }
 * }
 * ```
 *
 * Register the class with {@link provideEffects}:
 *
 * ```ts
 * providers: [
 *     provideStates([PostsState]),
 *     provideEffects([PostEffects]),
 * ]
 * ```
 *
 * @param action  The NGXS action class to listen to.
 * @param on      The lifecycle event to react to. Defaults to `EffectOn.Success`.
 */
export function Effect(action: ActionType, on: EffectOn = EffectOn.Success): MethodDecorator {
    return (target: object, propertyKey: string | symbol) => {
        const prototype = target as Record<string, unknown>;

        // Lazily initialize the metadata array on the prototype.
        if (!Object.prototype.hasOwnProperty.call(prototype, EFFECTS_METADATA_KEY)) {
            // Use defineProperty so the array is non-enumerable and doesn't leak into for..in.
            Object.defineProperty(prototype, EFFECTS_METADATA_KEY, {
                value: [] as EffectMetadata[],
                writable: false,
                enumerable: false,
                configurable: true,
            });
        }

        (prototype[EFFECTS_METADATA_KEY] as EffectMetadata[]).push({
            action,
            on,
            methodName: String(propertyKey),
        });
    };
}
