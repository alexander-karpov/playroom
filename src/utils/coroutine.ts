import { Ref } from './Ref';

// TODO: заменить на popmotion
export function coroutine(
    task: (cancellationToken: CancellationToken) => Promise<void>
): CancellationSource {
    const cancellationSource = new CancellationSource();

    void task(cancellationSource.token);

    return cancellationSource;
}

export class CancellationToken {
    private readonly requestedRef: Ref<boolean>;

    public constructor(requestedRef: Ref<boolean>) {
        this.requestedRef = requestedRef;
    }

    public get cancellationRequested() {
        return this.requestedRef.current;
    }
}

export class CancellationSource {
    public readonly token: CancellationToken;
    private readonly requestedRef = new Ref(false);

    public constructor() {
        this.token = new CancellationToken(this.requestedRef);
    }

    public cancel() {
        this.requestedRef.current = true;
    }
}
