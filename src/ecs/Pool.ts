export class Pool {
    /**
     * Находит свободную ячейку в массиве
     */
    public static alloc<T>(pool: T[], defaultValue: T): number {
        const freeIndex = pool.indexOf(defaultValue);

        if (freeIndex !== -1) {
            return freeIndex;
        }

        return pool.push(defaultValue) - 1;
    }
}
