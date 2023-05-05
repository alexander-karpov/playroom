import { type World, System } from './index';

export class Runtime {
    private readonly inputSystems: System[] = [];
    private readonly simulateSystems: System[] = [];
    private readonly outputSystems: System[] = [];
    private readonly sometimesSystems: System[] = [];

    private nextSometimesHandlerIndex = 0;
    private sinceLastSometimesCallSec = 0;

    public constructor(
        private readonly world: World,
        private readonly timeBetweenSometimesCallsSec = 5
    ) {}

    public addSystem(system: System) {
        this.registerSystemByHandlers(system);
        system.uploadSubscriptionToWorld(this.world);
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
     * Помещает систему в наборы наличию обработчика
     */
    private registerSystemByHandlers(system: System): void {
        if (this.isSystemOverridesHandler(system, 'onInput')) {
            this.inputSystems.push(system);
        }

        if (this.isSystemOverridesHandler(system, 'onSimulate')) {
            this.simulateSystems.push(system);
        }

        if (this.isSystemOverridesHandler(system, 'onOutput')) {
            this.outputSystems.push(system);
        }

        if (this.isSystemOverridesHandler(system, 'onSometimes')) {
            this.sometimesSystems.push(system);
        }
    }

    private isSystemOverridesHandler(system: System, methodName: keyof System): boolean {
        return system[methodName] !== System.prototype[methodName];
    }
}
