import type { World } from './index';

export abstract class System {
    /**
     * Сущности создаются.
     * Выполняется только один раз при старте.
     */
    public onCreate(world: World): void {
        throw new Error('Not implemented');
    }

    /**
     * Сущности созданы и их можно связать друг с другом.
     * Выполняется только один раз после onCreate.
     */
    public onLink(world: World): void {
        throw new Error('Not implemented');
    }

    public onInput(world: World, delta: number): void {
        throw new Error('Not implemented');
    }

    public onSimulate(world: World, delta: number): void {
        throw new Error('Not implemented');
    }

    public onOutput(world: World, delta: number): void {
        throw new Error('Not implemented');
    }

    public onSometimes(world: World): void {
        throw new Error('Not implemented');
    }
}