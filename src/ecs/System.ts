import { SimulationTime, World } from "./index";

export abstract class System {
    public onCreate(world: World): void {
        throw new Error("Not implemented");
    };
    public onUpdate(world: World, time: SimulationTime): void {
        throw new Error("Not implemented");
    };
}