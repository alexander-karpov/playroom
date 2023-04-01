import type { ComponentClass } from './ComponentClass';
import type { EntityChangeHandler } from './EntityChangeHandler';
import type { World } from './index';

export function subscribe(
    originalMethod: EntityChangeHandler,
    context: ClassMethodDecoratorContext<System>
): EntityChangeHandler {
    console.log(context);

    context.addInitializer(function () {
        console.log(this, context.access.get(this));
    });

    return originalMethod;
}

type Subscription = [readonly ComponentClass[], EntityChangeHandler];

export abstract class System {
    private subscriptionList: Subscription[] | undefined = [];

    /**
     * Подписывает метод на появление сущностей с указанными компонентами
     */
    public static on(query: readonly ComponentClass[]) {
        return function subscribe(
            originalMethod: EntityChangeHandler,
            context: ClassMethodDecoratorContext<System>
        ): EntityChangeHandler {
            context.addInitializer(function () {
                this.registerSubscription(query, originalMethod.bind(this));
            });

            return originalMethod;
        };
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

    public onInput(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onSimulate(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onSync(world: World, deltaS: number): void {
        throw new Error('Not implemented');
    }

    public onOutput(world: World, deltaS: number): void {
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
            world.subscribe(...sub);
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
