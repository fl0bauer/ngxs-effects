# @ngxs-labs/effects

Declarative side-effect handling for [NGXS](https://www.ngxs.io/).

React to action lifecycle events (`dispatch`, `success`, `error`, `canceled`) with a clean, class-based API — keeping your state
classes focused on state mutations while side effects live in dedicated effect classes.

## Installation

```bash
yarn add @ngxs-labs/effects
```

### Peer Dependencies

| Package         | Version   |
|-----------------|-----------|
| `@angular/core` | `^21.0.0` |
| `@ngxs/store`   | `^21.0.0` |
| `rxjs`          | `^7.8.0`  |

## Quick Start

### 1. Define Actions

```ts
export class CreatePost {
    static readonly type = '[Posts] Create';

    constructor(public payload: PostDto) {
    }
}
```

### 2. Create an Effects Class

The decorated method always receives the **action instance** as its first parameter (strongly typed).
For `EffectOn.Error`, the **error** is passed as the second parameter.

```ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Effect, EffectOn } from '@ngxs-labs/effects';
import { CreatePost } from './posts.actions';

@Injectable()
export class PostsEffects {
    private readonly router = inject(Router);

    @Effect(CreatePost, EffectOn.Success)
    onCreatePostSuccess(action: CreatePost) {
        console.log('Post created:', action.payload);
        this.router.navigate(['/posts']);
    }

    @Effect(CreatePost, EffectOn.Error)
    onCreatePostError(action: CreatePost, error: Error) {
        console.error('Failed to create post:', action.payload, error);
    }

    @Effect(CreatePost, EffectOn.Dispatch)
    onCreatePostDispatched(action: CreatePost) {
        console.log('Creating post…', action.payload);
    }

    @Effect(CreatePost, EffectOn.Canceled)
    onCreatePostCanceled(action: CreatePost) {
        console.warn('Post creation canceled:', action.payload);
    }

    // React to multiple lifecycle events with a single handler
    @Effect(CreatePost, [EffectOn.Success, EffectOn.Canceled])
    onCreatePostSettled(action: CreatePost) {
        console.log('Post creation settled (success or canceled):', action.payload);
    }
}
```

### 3. Register Effects

```ts
import { provideEffects } from '@ngxs-labs/effects';
import { provideStates } from '@ngxs/store';

export const routes: Routes = [
    {
        path: '',
        component: PostsPage,
        providers: [provideStates([PostsState]), provideEffects([PostsEffects])],
    },
];
```

## API

### `@Effect(action, on?)`

Method decorator that marks a method as an NGXS action side effect. The first argument accepts a **single action class**
or an **array of action classes**. The second argument accepts a **single `EffectOn` value** or an **array of `EffectOn`
values** — when an array is provided the handler fires for **each** listed lifecycle event independently. The action type
is inferred from the first argument and the decorated method receives a strongly-typed action instance as its first
parameter.

| Parameter | Type                                    | Default            | Description                                                                          |
|-----------|-----------------------------------------|--------------------|--------------------------------------------------------------------------------------|
| `action`  | `ActionType \| ActionType[]`            | —                  | A single NGXS action class **or** an array of action classes.                        |
| `on`      | `EffectOn \| EffectOn[]`                | `EffectOn.Success` | The lifecycle event(s) to react to. Accepts a single value or an array of values.    |

#### Single Action

```ts
@Effect(CreatePost, EffectOn.Success)
onCreatePostSuccess(action: CreatePost) {
    this.router.navigate(['/posts']);
}
```

#### Array of Actions

When an array is passed, the handler fires for **every** listed action. The action parameter is typed as
the **union** of all action instance types — use `instanceof` to narrow if needed.

```ts
@Effect([CreatePost, UpdatePost], EffectOn.Success)
onPostSaved(action: CreatePost | UpdatePost) {
    this.router.navigate(['/posts']);
}
```

#### Method Signatures

| Lifecycle            | Signature                           |
|----------------------|-------------------------------------|
| `EffectOn.Dispatch`  | `(action: T) => void`               |
| `EffectOn.Success`   | `(action: T) => void`               |
| `EffectOn.Error`     | `(action: T, error: Error) => void` |
| `EffectOn.Canceled`  | `(action: T) => void`               |

All parameters are optional —> you can omit the action (or both action and error) if you don't need them.

#### Multiple Lifecycle Events

Pass an array to the second parameter to react to **multiple** lifecycle events with a single handler.
The handler fires independently for each listed event.

```ts
@Effect(CreatePost, [EffectOn.Success, EffectOn.Error])
onCreatePostSettled(action: CreatePost) {
    // Fires after success OR after error.
    console.log('CreatePost settled');
}
```

This also works in combination with an array of actions:

```ts
@Effect([CreatePost, UpdatePost], [EffectOn.Dispatch, EffectOn.Success])
onPostActivity(action: CreatePost | UpdatePost) {
    // Fires on dispatch AND on success for both CreatePost and UpdatePost.
}
```

### `EffectOn`

| Value      | Description                                                                                                                                       |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `Dispatch` | Runs when the action is dispatched (before the handler executes). The method receives the **action instance**.                                    |
| `Success`  | Runs after the action handler completes successfully. The method receives the **action instance**.                                                |
| `Error`    | Runs when the action handler throws an error. The method receives the **action instance** as the first parameter and the **error** as the second. |
| `Canceled` | Runs when the action is canceled (e.g. by a newer dispatch with `cancelUncompleted`). The method receives the **action instance**.                |

### `provideEffects(effectClasses)`

Registers effect classes so they are instantiated when the environment injector is created, and wires up all `@Effect()`
-decorated methods automatically.

Effects are **scoped** to the injector they are registered in. When the injector is destroyed (e.g. navigating away from
a lazy-loaded route), all subscriptions are automatically cleaned up.

## Architecture

Effect classes are **plain `@Injectable()` classes** — no base class required. They follow the same registration pattern
as NGXS state classes (`provideStates` → `provideEffects`).

### Why separate effects from state?

- **State classes** handle state mutations (pure logic).
- **Effect classes** handle side effects (navigation, toasts, logging, API calls).

This separation keeps your code clean, testable, and maintainable.

## Testing

```ts
import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { provideEffects } from '@ngxs-labs/effects';

describe('PostsEffects', () => {
    let store: Store;
    let effects: PostsEffects;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideStore([PostsState]), provideEffects([PostsEffects])],
        });

        store = TestBed.inject(Store);
        effects = TestBed.inject(PostsEffects);
    });

    it('should navigate on success', () => {
        const spy = jest.spyOn(effects, 'onCreatePostSuccess');
        store.dispatch(new CreatePost({title: 'Hello'}));
        expect(spy).toHaveBeenCalledWith(expect.any(CreatePost));
    });
});
```
