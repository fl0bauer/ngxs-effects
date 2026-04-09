# @ngxs-labs/effects

Declarative side-effect handling for [NGXS](https://www.ngxs.io/).

React to action lifecycle events (`dispatch`, `success`, `error`) with a clean, class-based API — keeping your state
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

Method decorator that marks a method as an NGXS action side effect. The action type is inferred from the first argument
and the decorated method receives a strongly-typed action instance as its first parameter.

| Parameter | Type         | Default            | Description                         |
|-----------|--------------|--------------------|-------------------------------------|
| `action`  | `ActionType` | —                  | The NGXS action class to listen to. |
| `on`      | `EffectOn`   | `EffectOn.Success` | The lifecycle event to react to.    |

#### Method Signatures

| Lifecycle           | Signature                           |
|---------------------|-------------------------------------|
| `EffectOn.Dispatch` | `(action: T) => void`               |
| `EffectOn.Success`  | `(action: T) => void`               |
| `EffectOn.Error`    | `(action: T, error: Error) => void` |

All parameters are optional —> you can omit the action (or both action and error) if you don't need them.

### `EffectOn`

| Value      | Description                                                                                                                                       |
|------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `Dispatch` | Runs when the action is dispatched (before the handler executes). The method receives the **action instance**.                                    |
| `Success`  | Runs after the action handler completes successfully. The method receives the **action instance**.                                                |
| `Error`    | Runs when the action handler throws an error. The method receives the **action instance** as the first parameter and the **error** as the second. |

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
