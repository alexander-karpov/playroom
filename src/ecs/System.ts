import { World } from "./index";

export abstract class System {
    /**
     * Сущности создаются
     */
    public onCreate(world: World): void {
        throw new Error("Not implemented");
    };

    /**
     * Сущности созданы и их можно связать
     * друг с другом
     */
    public onLink(world: World): void {
        throw new Error("Not implemented");
    };

    public onInput(world: World, delta: number): void {
        throw new Error("Not implemented");
    };

    public onSimulate(world: World, delta: number): void {
        throw new Error("Not implemented");
    };

    public onOutput(world: World, delta: number): void {
        throw new Error("Not implemented");
    };
}