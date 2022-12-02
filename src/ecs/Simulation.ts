import { World, System, SimulationTime } from "./index";


export class Simulation {
    systems: System[] = [];
    time: SimulationTime = new SimulationTime(0, 0);
    startSimulationTimeMs: number = 0;
    world: World = new World();

    public update(): void {
        if (this.startSimulationTimeMs === 0) {
            this.startSimulationTimeMs = Date.now();
        }

        this.updateSimulationTime();

        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i]!.update(this.world, this.time);
        }
    }

    public addSystem(system: System) {
        this.systems.push(system);
    }

    private updateSimulationTime() {

        const time = (Date.now() - this.startSimulationTimeMs) / 1000;

        // @ts-expect-error
        this.time.delta = time - this.time.time;

        // @ts-expect-error
        this.time.time = time;
    }
}
