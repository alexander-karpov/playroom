import { SimulationTime, World } from "./index";

export abstract class System {
    public abstract update(world: World, time: SimulationTime): void;
}
