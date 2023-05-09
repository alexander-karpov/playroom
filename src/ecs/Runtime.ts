import { type World, System } from './index';

export class Runtime {
    private readonly inputSystems: System[] = [];
    private readonly updateSystems: System[] = [];
    private readonly outputSystems: System[] = [];

    public constructor(private readonly world: World) {}

    public addSystem(system: System) {
        this.registerSystemByHandlers(system);
        system.uploadSubscriptionToWorld(this.world);
    }

    public update(deltaSec: number): void {
        this.callRuntimeHandlers(deltaSec);
        this.world.applyChanges();
    }

    private callRuntimeHandlers(deltaS: number): void {
        for (const system of this.inputSystems) {
            system.onInput(this.world, deltaS);
        }

        for (const system of this.updateSystems) {
            system.onUpdate(this.world, deltaS);
        }

        for (const system of this.outputSystems) {
            system.onOutput(this.world, deltaS);
        }
    }

    /**
     * Помещает систему в наборы наличию обработчика
     */
    private registerSystemByHandlers(system: System): void {
        if (this.isSystemOverridesHandler(system, 'onInput')) {
            this.inputSystems.push(system);
        }

        if (this.isSystemOverridesHandler(system, 'onUpdate')) {
            this.updateSystems.push(system);
        }

        if (this.isSystemOverridesHandler(system, 'onOutput')) {
            this.outputSystems.push(system);
        }
    }

    private isSystemOverridesHandler(system: System, methodName: keyof System): boolean {
        return system[methodName] !== System.prototype[methodName];
    }
}
