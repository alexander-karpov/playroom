import type { ComponentClass } from './ComponentClass';
import type { EntityChangeHandler } from './EntityChangeHandler';

/**
 * Порядковый номер сущности в массиве.
 * Может быть переиспользовал
 */
export type EntityId = number;

/**
 * Кодирует перечисление нескольких компонентов в виде bitmap.
 * Номер бина соотв. номеру класса компонента в componentClasses (componentClassesId + 1)
 */
type QueryMask = number;

/**
 * Первые 5 байт занимает СomponentClassesId,
 * остальное занимает EntityId
 */
type EntityComponentId = number;

type Component = unknown;

export class World {
    /**
     * Индекс в этом массиве – это id сущности
     * Значение - это битовая маска прикрепленных компонентов
     * где номер включенного бита – это индекс в массиве components
     * 0 – это свободный id
     */
    private readonly entities: number[] = [];

    /**
     * Эти два массива организованы так же, как entities
     * Они хранят добавленные и удаленные компоненты сущности
     * на данной итерации. После очередного цикла работы,
     * изменения переносятся в entities и массивы очищаются
     */
    private readonly added: number[] = [];
    private readonly deleted: number[] = [];

    /**
     * Для отслеживания первого попадания сущности в индекс
     * для срабатывания подписки на маску
     * Ключ – маска запроса
     * Значение - массив сущностей, соответствующих маске
     */
    // private readonly indices = new Map<number, number[]>();

    /**
     * Индекс в этом массиве – это id подписки
     * Значение - маска подписки
     */
    private readonly subscriptions: number[] = [];

    /**
     * Индекс в этом массиве – это id подписки
     * Значение - обработчик подписки
     */
    private readonly changeHandlers: EntityChangeHandler[] = [];

    private readonly componentClasses: ComponentClass[] = [];

    /**
     * Ключ - сочетание componentClassesId и entityId
     * Значение - инстанс компонента
     */
    private readonly components = new Map<EntityComponentId, Component>();

    /**
     * Регистрирует новую сущность (id переиспользуются)
     * @param componentClass Первый компонент новой сущности
     */
    public addEntity<T>(componentClass: ComponentClass<T>): [entityId: number, component: T] {
        // 0 - отсутствие компонентов
        const freeEntityValue = 0;
        let freeEntityId = this.entities.indexOf(freeEntityValue);

        if (freeEntityId === -1 || this.added[freeEntityId] !== 0) {
            this.entities.push(0);
            this.added.push(0);
            this.deleted.push(0);

            freeEntityId = this.entities.length - 1;
        }

        const component = this.addComponent(componentClass, freeEntityId);

        return [freeEntityId, component];
    }

    /**
     * Планирует добавление компонента к сущности
     * @param entity
     */
    public addComponent<T>(componentClass: ComponentClass<T>, entityId: number): T {
        const componentClassId = this.componentClassId(componentClass);
        const componentId = this.componentId(entityId, componentClassId);

        // TODO: сделать только в dev-mode
        if (this.hasComponentClassId(componentClassId, entityId)) {
            throw new Error(
                `Entity ${entityId} already contains a component ${componentClass.name}`
            );
        }

        this.added[entityId] |= 1 << componentClassId;

        const component = new componentClass();
        this.components.set(componentId, component);

        return component;
    }

    public getComponent<T>(componentClass: ComponentClass<T>, entityId: number): T {
        const componentClassId = this.componentClassId(componentClass);
        const componentId = this.componentId(entityId, componentClassId);

        // TODO: сделать только в dev-mode
        if (!this.hasComponentClassId(componentClassId, entityId)) {
            throw new Error(
                `Entity ${entityId} does not contain a component ${componentClass.name}`
            );
        }

        return this.components.get(componentId) as T;
    }

    public hasComponent<T>(componentClass: ComponentClass<T>, entityId: number): boolean {
        return this.hasComponentClassId(this.componentClassId(componentClass), entityId);
    }

    public deleteComponent(componentClass: ComponentClass, entityId: number): void {
        const componentClassId = this.componentClassId(componentClass);

        this.deleted[entityId] |= 1 << componentClassId;
    }

    public select(query: readonly ComponentClass[]): readonly EntityId[] {
        const selectResult = [];
        const queryMask = this.queryMask(query);

        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            if ((this.entities[entityId]! & queryMask) === queryMask) {
                selectResult.push(entityId);
            }
        }

        return selectResult;
    }

    public cound(query: readonly ComponentClass[]): number {
        let counder = 0;
        const queryMask = this.queryMask(query);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            if ((this.entities[entityId]! & queryMask) === queryMask) {
                counder++;
            }
        }

        return counder;
    }

    public subscribe(query: readonly ComponentClass[], handler: EntityChangeHandler): void {
        const queryMask = this.queryMask(query);

        this.subscriptions.push(queryMask);
        this.changeHandlers.push(handler);
    }

    public applyChanges(): void {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of

        for (let eid = 0; eid < this.entities.length; eid++) {
            /**
             * Добавленные компоненты
             */
            if (this.added[eid] !== 0) {
                const addedMask = this.added[eid]!;
                this.added[eid] = 0;

                this.entities[eid] |= addedMask;

                /**
                 * Вызов подписок
                 */

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let si = 0; si < this.subscriptions.length; si++) {
                    const subsMask = this.subscriptions[si]!;

                    if (
                        /**
                         * Важно проверить, что интересующие подписчика компоненты
                         * были изменены именно в этой итерации
                         */
                        (subsMask & addedMask) !== 0 &&
                        (this.entities[eid]! & subsMask) === subsMask
                    ) {
                        this.changeHandlers[si]!(this, eid);
                    }
                }
            }

            /**
             * Удаленные компоненты
             */
            if (this.deleted[eid] !== 0) {
                this.entities[eid] ^= this.deleted[eid]!;
                this.deleted[eid] = 0;
            }
        }
    }

    /**
     * Возвращает общую маску компонентов
     */
    private queryMask(query: readonly ComponentClass[]): QueryMask {
        let mask = 0;

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < query.length; i++) {
            mask |= 1 << this.componentClassId(query[i]!);
        }

        return mask;
    }

    private componentId(entityId: number, componentClassId: number): number {
        /**
         * componentClassId располагаем в первые 5 байт,
         * entityId в остальные
         */
        return componentClassId + (entityId << 5);
    }

    /**
     * Добавляет компонент в список (если ещё нет)
     */
    private componentClassId(componentClass: ComponentClass): number {
        const componentClassId = this.componentClasses.indexOf(componentClass);

        if (componentClassId !== -1) {
            return componentClassId;
        }

        // TODO: вернуть проверку в dev-mode
        if (this.componentClasses.length === 32) {
            throw new Error('Компонентов уже 32');
        }

        this.componentClasses.push(componentClass);
        return this.componentClasses.length - 1;
    }

    private hasComponentClassId(componentClassId: number, entityId: number): boolean {
        const componentClassMask = 1 << componentClassId;

        return (this.entities[entityId]! & componentClassMask) === componentClassMask;
    }
}
