export class Increment {
    static readonly type = '[Counter] Increment';
}

export class SetCount {
    static readonly type = '[Counter] Set Count';

    constructor(public readonly payload: { count: number }) {}
}

export class FailingAction {
    static readonly type = '[Counter] Failing Action';
}
