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

    public onInput(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onSimulate(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onSync(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onOutput(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onSometimes(world: World): void {
        throw new Error('Not implemented');
    }
}
