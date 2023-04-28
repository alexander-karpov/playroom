import { type World, System } from './index';

export class Runtime {
    private inputSystems!: System[];
    private simulateSystems!: System[];
    private outputSystems!: System[];
    private sometimesSystems!: System[];

    private nextSometimesHandlerIndex = 0;
    private sinceLastSometimesCallSec = 0;

    public constructor(
        private readonly world: World,
        private readonly systems: System[],
        private readonly timeBetweenSometimesCallsSec = 5
    ) {}

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
        this.sinceLastSometimesCallSec += timeDeltaS;

        if (
            this.sinceLastSometimesCallSec >
            this.timeBetweenSometimesCallsSec / this.sometimesSystems.length
        ) {
            this.nextSometimesHandlerIndex %= this.sometimesSystems.length;
            this.sometimesSystems[this.nextSometimesHandlerIndex]!.onSometimes(this.world);
            this.nextSometimesHandlerIndex += 1;
            this.sinceLastSometimesCallSec = 0;
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
