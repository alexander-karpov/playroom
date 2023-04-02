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
     * Индекс в этом массиве – это id подписки
     * Значение - маска подписки
     */
    private readonly onAddQueries: number[] = [];
    private readonly onDeleteQueries: number[] = [];

    /**
     * Индекс в этом массиве – это id подписки
     * Значение - обработчик подписки
     */
    private readonly onAddHandlers: EntityChangeHandler[] = [];
    private readonly onDeleteHandlers: EntityChangeHandler[] = [];

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
            const existsAndAddedMask = this.entities[entityId]! | this.added[entityId]!;

            if ((existsAndAddedMask & queryMask) === queryMask) {
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
            const existsAndAddedMask = this.entities[entityId]! | this.added[entityId]!;

            if ((existsAndAddedMask & queryMask) === queryMask) {
                counder++;
            }
        }

        return counder;
    }

    public onAdd(query: readonly ComponentClass[], handler: EntityChangeHandler): void {
        const queryMask = this.queryMask(query);

        this.onAddQueries.push(queryMask);
        this.onAddHandlers.push(handler);
    }

    public onDelete(query: readonly ComponentClass[], handler: EntityChangeHandler): void {
        const queryMask = this.queryMask(query);

        this.onDeleteQueries.push(queryMask);
        this.onDeleteHandlers.push(handler);
    }

    public applyChanges(): void {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of

        for (let eid = 0; eid < this.entities.length; eid++) {
            /**
             * Эта сущность могла быть изменена. Тогда обновления
             * нужно применить сразу, в этой же итерации, чтобы не было
             * ощущения задержки реакции
             */
            let entityTriggersHandler = false;

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
                for (let si = 0; si < this.onAddQueries.length; si++) {
                    const subsMask = this.onAddQueries[si]!;

                    if (
                        /**
                         * Важно проверить, что интересующие подписчика компоненты
                         * были изменены именно в этой итерации
                         */
                        (subsMask & addedMask) !== 0 &&
                        (this.entities[eid]! & subsMask) === subsMask
                    ) {
                        this.onAddHandlers[si]!(this, eid);
                        entityTriggersHandler = true;
                    }
                }
            }

            /**
             * Удаленные компоненты
             */
            if (this.deleted[eid] !== 0) {
                const deletedMask = this.deleted[eid]!;
                this.deleted[eid] = 0;

                /**
                 * Вызов подписок
                 */

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let si = 0; si < this.onDeleteQueries.length; si++) {
                    const subsMask = this.onDeleteQueries[si]!;

                    if (
                        /**
                         * Важно проверить, что интересующие подписчика компоненты
                         * были изменены именно в этой итерации
                         */
                        (subsMask & deletedMask) !== 0 &&
                        (this.entities[eid]! & subsMask) === subsMask
                    ) {
                        this.onDeleteHandlers[si]!(this, eid);
                        entityTriggersHandler = true;
                    }
                }

                this.entities[eid] ^= deletedMask;
            }

            /**
             * Повторная обработка
             */

            if (entityTriggersHandler) {
                // TODO Тут правильнее было бы пройти снова по всем сущностям
                eid--;
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
        const existsAndAddedMask = this.entities[entityId]! | this.added[entityId]!;

        return (existsAndAddedMask & componentClassMask) === componentClassMask;
    }
}
