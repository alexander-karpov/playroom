import { type World, System } from './index';

export class Runtime<TSystem extends System = System> {
    private readonly systems: TSystem[] = [];
    private readonly inputSystems: TSystem[] = [];
    private readonly updateSystems: TSystem[] = [];
    private readonly outputSystems: TSystem[] = [];
    private readonly forEveryHandlers: ((system: TSystem) => void)[] = [];

    public constructor(private readonly world: World) {}

    public addSystem(system: TSystem) {
        this.registerSystem(system);
        system.uploadSubscriptionToWorld(this.world);

        this.forEveryHandlers.forEach((handler) => handler(system));
    }

    public update(deltaSec: number): void {
        this.callRuntimeHandlers(deltaSec);
        this.world.applyChanges();
    }

    public forEvery(handler: (system: TSystem) => void): void {
        this.systems.forEach(handler);
        this.forEveryHandlers.push(handler);
    }

    // TODO: Возможно стоит заменить циклы вызовов
    // на формирование динамической лямбды с вложенными вызовами
    // как это сделано в камерах babylonjs c checkInputs
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
    private registerSystem(system: TSystem): void {
        this.systems.push(system);

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

    private isSystemOverridesHandler(system: TSystem, methodName: keyof TSystem): boolean {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return system.constructor.prototype[methodName] !== System.prototype[methodName];
    }
}
