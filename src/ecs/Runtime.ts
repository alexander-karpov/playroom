import { World, System } from './index';

export class Runtime {
    private readonly world: World = new World();

    private inputSystems!: System[];
    private simulateSystems!: System[];
    private syncSystems!: System[];
    private outputSystems!: System[];
    private sometimesSystems!: System[];

    private readonly timeBetweenSameSometimesCallsS = 5;
    private nextSometimesHandlerIndex = 0;
    private timeSinceLastSometimesCallS = 0;

    public constructor(private readonly systems: System[]) {}

    public initialize() {
        this.separateSystemsByHandlers();
        this.callStartupHandlers();

        for (const system of this.systems) {
            system.uploadSubscriptionToWorld(this.world);
        }
    }

    public update(deltaS: number): void {
        this.callRuntimeHandlers(deltaS);
        this.callSometimesHandlers(deltaS);
        this.world.applyChanges();
    }

    private callRuntimeHandlers(deltaS: number): void {
        for (const system of this.inputSystems) {
            system.onInput(this.world, deltaS);
        }

        for (const system of this.simulateSystems) {
            system.onSimulate(this.world, deltaS);
        }

        for (const system of this.syncSystems) {
            system.onSync(this.world, deltaS);
        }

        for (const system of this.outputSystems) {
            system.onOutput(this.world, deltaS);
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

    private callSometimesHandlers(timeDeltaS: number): void {
        this.timeSinceLastSometimesCallS += timeDeltaS;

        if (
            this.timeSinceLastSometimesCallS >
            this.timeBetweenSameSometimesCallsS / this.sometimesSystems.length
        ) {
            this.nextSometimesHandlerIndex %= this.sometimesSystems.length;
            this.sometimesSystems[this.nextSometimesHandlerIndex]!.onSometimes(this.world);
            this.nextSometimesHandlerIndex += 1;
            this.timeSinceLastSometimesCallS = 0;
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

        this.syncSystems = this.systems.filter((s) => this.isSystemOverridesHandler(s, 'onSync'));

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
