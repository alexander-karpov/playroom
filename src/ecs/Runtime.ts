import { World, System } from './index';

export class Runtime {
    private readonly world: World = new World();

    private inputSystems!: System[];
    private simulateSystems!: System[];
    private outputSystems!: System[];
    private sometimesSystems!: System[];

    private readonly timeBetweenSameSometimesCallsMs = 5000;
    private nextSometimesHandlerIndex = 0;
    private timeSinceLastSometimesCallMs = 0;

    public constructor(private readonly systems: System[]) {
        this.separateSystemsByHandlers();
        this.callStartupHandlers();
    }

    public update(deltaMs: number): void {
        this.callRuntimeHandlers(deltaMs);
        this.callSometimesHandlers(deltaMs);
    }

    private callRuntimeHandlers(deltaMs: number): void {
        for (const system of this.inputSystems) {
            system.onInput(this.world, deltaMs);
        }

        for (const system of this.simulateSystems) {
            system.onSimulate(this.world, deltaMs);
        }

        for (const system of this.outputSystems) {
            system.onOutput(this.world, deltaMs);
        }
    }

    private callStartupHandlers(): void {
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

    private callSometimesHandlers(timeDeltaMs: number): void {
        this.timeSinceLastSometimesCallMs += timeDeltaMs;

        if (
            this.timeSinceLastSometimesCallMs >
            this.timeBetweenSameSometimesCallsMs / this.sometimesSystems.length
        ) {
            this.nextSometimesHandlerIndex %= this.sometimesSystems.length;
            this.sometimesSystems[this.nextSometimesHandlerIndex]!.onSometimes(this.world);
            this.nextSometimesHandlerIndex += 1;
            this.timeSinceLastSometimesCallMs = 0;
        }
    }

    /**
     * Разделяем системы заранее, чтобы не делать этого на ходу
     */
    private separateSystemsByHandlers(): void {
        this.inputSystems = this.systems.filter((s) => this.isSystemOverridesHandler(s, 'onInput'));
        this.simulateSystems = this.systems.filter((s) =>
            this.isSystemOverridesHandler(s, 'onSimulate')
        );
        this.outputSystems = this.systems.filter((s) =>
            this.isSystemOverridesHandler(s, 'onOutput')
        );

        this.sometimesSystems = this.systems.filter((s) =>
            this.isSystemOverridesHandler(s, 'onSometimes')
        );
    }

    private isSystemOverridesHandler(system: System, methodName: keyof System): boolean {
        return system[methodName] !== System.prototype[methodName];
    }
}

console.warn(`
Очищать из списка системы только onCreate и onLink чтобы не держать память

`);
