export class Ref<T> {
    public current: T;

    public constructor(value: T) {
        this.current = value;
    }
}
