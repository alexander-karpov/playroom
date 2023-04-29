import type { ComponentClass } from './ComponentClass';
import type { EntityChangeHandler } from './EntityChangeHandler';
import type { World } from './index';

type Subscription = [readonly ComponentClass[], EntityChangeHandler, boolean];

export abstract class System {
    private subscriptionList: Subscription[] | undefined = [];

    /**
     * Подписывает метод на появление сущностей с указанными компонентами
     */
    public static on(query: readonly ComponentClass[], onAdd: boolean = true) {
        return function subscribe(
            originalMethod: EntityChangeHandler,
            context: ClassMethodDecoratorContext<System>
        ): EntityChangeHandler {
            context.addInitializer(function () {
                this.registerSubscription(query, originalMethod.bind(this), onAdd);
            });

            return originalMethod;
        };
    }

    /**
     * Подписывает метод на появление сущностей с указанными компонентами
     */
    public static onNot(query: readonly ComponentClass[]) {
        return System.on(query, false);
    }

    /**
     * Сущности создаются.
     * Выполняется только один раз при старте.
     */
    public onCreate(world: World): void {
        throw new Error('Not implemented');
    }

    /**
     * Сущности созданы и их можно связать друг с другом.
     * Выполняется только один раз после onCreate.
     */
    public onLink(world: World): void {
        throw new Error('Not implemented');
    }

    public onInput(world: World, deltaSec: number): void {
        throw new Error('Not implemented');
    }

    public onSimulate(world: World, deltaSec: number): void {
        throw new Error('Not implemented');
    }

    public onOutput(world: World, deltaSec: number): void {
        throw new Error('Not implemented');
    }

    public onSometimes(world: World): void {
        throw new Error('Not implemented');
    }

    public uploadSubscriptionToWorld(world: World): void {
        if (this.subscriptionList == null) {
            throw new Error('Subscriptions already uploaded to world');
        }

        for (const sub of this.subscriptionList) {
            if (sub[2]) {
                world.onAttach(sub[0], sub[1]);
            } else {
                world.onDetach(sub[0], sub[1]);
            }
        }

        this.subscriptionList = undefined;
    }

    private registerSubscription(...sub: Subscription): void {
        if (this.subscriptionList == null) {
            throw new Error('Subscriptions already uploaded to world');
        }

        this.subscriptionList.push(sub);
    }
}
