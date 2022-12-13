import { World, System } from './index';


export class Runtime {
    private readonly world: World = new World();

    private inputSystems!: System[];
    private simulateSystems!: System[];
    private outputSystems!: System[];

    public constructor(
        private readonly systems: System[]
    ) {
        this.separateSystemsByHandlers();
        this.callStartupSystemHandlers();
    }

    public update(deltaS: number): void {
        this.callRuntimeSystemHandlerts(deltaS);
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

    private callStartupSystemHandlers(): void {
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
    private separateSystemsByHandlers(): void {
        this.inputSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onInput'));
        this.simulateSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onSimulate'));
        this.outputSystems = this.systems.filter(s => this.isSystemOverridesHandler(s, 'onOutput'));
    }

    private isSystemOverridesHandler(system: System, methodName: keyof System): boolean {
        return system[methodName] !== System.prototype[methodName];
    }
}
