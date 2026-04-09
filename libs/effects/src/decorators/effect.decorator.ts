import { ActionDef, ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';
import { EffectMetadata, EffectMethodDescriptor, EFFECTS_METADATA_KEY } from '../models/effect.model';

/**
 * Method decorator that marks a method as an NGXS action side effect.
 *
 * Works exactly like `@Action()` in NGXS state classes, but for side effects
 * that should **not** live in the state handler (navigation, toasts, logging, etc.).
 *
 * The decorated method always receives the **action instance** as its first
 * parameter (strongly typed). For `EffectOn.Error` the **error** is passed as
 * the second parameter.
 *
 * - `EffectOn.Dispatch` — `(action: T) => void` — fires when the action is dispatched (before the handler runs).
 * - `EffectOn.Success` (default) — `(action: T) => void` — fires after the handler completes successfully.
 * - `EffectOn.Error` — `(action: T, error: Error) => void` — fires when the handler throws.
 *
 * ## Usage
 *
 * ```ts
 * @Injectable()
 * export class PostEffects {
 *     private readonly router = inject(Router);
 *
 *     @Effect(CreatePost, EffectOn.Success)
 *     onCreatePostSuccess(action: CreatePost) {
 *         this.router.navigate(['/posts']);
 *     }
 *
 *     @Effect(CreatePost, EffectOn.Error)
 *     onCreatePostError(action: CreatePost, error: Error) {
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
export function Effect<T extends ActionDef>(
    action: T,
    on?: EffectOn,
): (target: object, propertyKey: string | symbol, descriptor: EffectMethodDescriptor<InstanceType<T>>) => void;
export function Effect(action: ActionType, on?: EffectOn): MethodDecorator;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Effect(action: any, on: EffectOn = EffectOn.Success) {
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
