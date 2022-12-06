import { World, System, } from "./index";


export class Simulation {
    private lastUpdateTime: number = 0;
    private world: World = new World();

    private inputSystems!: System[]
    private simulateSystems!: System[]
    private outputSystems!: System[]

    constructor(
        private readonly systems: System[]
    ) {

        this.separateSystemsByHandlers();
        this.callStartupSystemHandlers();
    }

    public update() {
        const timeDelta = this.updateTime();

        this.callRuntimeSystemHandlerts(timeDelta);
    }

    private callRuntimeSystemHandlerts(timeDelta: number): void {
        for (const system of this.inputSystems) {
            system.onInput(this.world, timeDelta);
        }

        for (const system of this.simulateSystems) {
            system.onSimulate(this.world, timeDelta);
        }

        for (const system of this.outputSystems) {
            system.onOutput(this.world, timeDelta);
        }
    }

    private callStartupSystemHandlers() {
        for (const system of this.systems) {
            if (this.isSystemOverridesHandler(system, 'onCreate')) {
                system.onCreate(this.world);
            }
        }

        for (const system of this.systems) {
            if (this.isSystemOverridesHandler(system, 'onLink')) {
                system.onLink(this.world);
            }
        }
    }

    /**
     * Разделяем системы заранее, чтобы не делать этого на ходу
     */
    private separateSystemsByHandlers() {
        this.inputSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onInput'));
        this.simulateSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onSimulate'));
        this.outputSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onOutput'));
    }

    private isSystemOverridesHandler(system: System, methodName: keyof System) {
        return system[methodName] !== System.prototype[methodName];
    }

    private updateTime() {
        const now = Date.now();
        const delta = (now - this.lastUpdateTime) / 1000;

        this.lastUpdateTime = now;

        return delta;
    }
}
