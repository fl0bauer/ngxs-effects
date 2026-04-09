import { ActionDef, ActionType } from '@ngxs/store';
import { EffectOn } from '../enums/effect-on.enum';
import { EffectMetadata, EffectMethodDescriptor, ExtractActionType, EFFECTS_METADATA_KEY } from '../models/effect.model';

/**
 * Method decorator that marks a method as an NGXS action side effect.
 *
 * Works exactly like `@Action()` in NGXS state classes, but for side effects
 * that should **not** live in the state handler (navigation, toasts, logging, etc.).
 *
 * The first parameter accepts a **single action class** or an **array of action classes**.
 * When an array is provided the method fires for every listed action and the
 * action parameter is typed as the **union** of all action instance types.
 *
 * The second parameter accepts a **single `EffectOn` value** or an **array of
 * `EffectOn` values**. When an array is provided the handler fires for **each**
 * listed lifecycle event independently.
 *
 * The decorated method always receives the **action instance** as its first
 * parameter (strongly typed). For `EffectOn.Error` the **error** is passed as
 * the second parameter.
 *
 * - `EffectOn.Dispatch` — `(action: T) => void` — fires when the action is dispatched (before the handler runs).
 * - `EffectOn.Success` (default) — `(action: T) => void` — fires after the handler completes successfully.
 * - `EffectOn.Error` — `(action: T, error: Error) => void` — fires when the handler throws.
 * - `EffectOn.Canceled` — `(action: T) => void` — fires when the action is canceled.
 *
 * ## Usage
 *
 * ```ts
 * @Injectable()
 * export class PostEffects {
 *     private readonly router = inject(Router);
 *
 *     // Single action
 *     @Effect(CreatePost, EffectOn.Success)
 *     onCreatePostSuccess(action: CreatePost) {
 *         this.router.navigate(['/posts']);
 *     }
 *
 *     // Array of actions
 *     @Effect([CreatePost, UpdatePost], EffectOn.Success)
 *     onPostSaved(action: CreatePost | UpdatePost) {
 *         this.router.navigate(['/posts']);
 *     }
 *
 *     // Multiple lifecycle events
 *     @Effect(CreatePost, [EffectOn.Success, EffectOn.Error])
 *     onCreatePostSettled(action: CreatePost) {
 *         console.log('CreatePost settled');
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
 * @param action  A single NGXS action class **or** an array of action classes to listen to.
 * @param on      The lifecycle event(s) to react to. Accepts a single `EffectOn` or an array. Defaults to `EffectOn.Success`.
 */
export function Effect<T extends ActionDef>(
    action: T,
    on?: EffectOn | EffectOn[],
): (target: object, propertyKey: string | symbol, descriptor: EffectMethodDescriptor<InstanceType<T>>) => void;
export function Effect<T extends ActionDef[]>(
    actions: [...T],
    on?: EffectOn | EffectOn[],
): (target: object, propertyKey: string | symbol, descriptor: EffectMethodDescriptor<ExtractActionType<T>>) => void;
export function Effect(action: ActionType | ActionType[], on?: EffectOn | EffectOn[]): MethodDecorator;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Effect(actionOrActions: any, on: EffectOn | EffectOn[] = EffectOn.Success) {
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

        // Normalize to always store arrays.
        const actions: ActionType[] = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
        const onArray: EffectOn[] = Array.isArray(on) ? on : [on];

        (prototype[EFFECTS_METADATA_KEY] as EffectMetadata[]).push({
            actions,
            on: onArray,
            methodName: String(propertyKey),
        });
    };
}
