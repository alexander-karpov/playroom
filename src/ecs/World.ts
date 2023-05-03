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
    private readonly attached: number[] = [];
    private readonly detached: number[] = [];

    /**
     * Индекс в этом массиве – это id подписки
     * Значение - маска подписки
     */
    private readonly onAttachQueries: number[] = [];
    private readonly onDetachQueries: number[] = [];

    /**
     * Индекс в этом массиве – это id подписки
     * Значение - обработчик подписки
     */
    private readonly onAttachHandlers: EntityChangeHandler[] = [];
    private readonly onDetachHandlers: EntityChangeHandler[] = [];

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
    public newEntity<T>(componentClass: ComponentClass<T>): [entityId: number, component: T] {
        // 0 - отсутствие компонентов
        const freeEntityValue = 0;
        let freeEntityId = this.entities.indexOf(freeEntityValue);

        if (freeEntityId === -1 || this.attached[freeEntityId] !== 0) {
            this.entities.push(0);
            this.attached.push(0);
            this.detached.push(0);

            freeEntityId = this.entities.length - 1;
        }

        const component = this.attach(freeEntityId, componentClass);

        return [freeEntityId, component];
    }

    /**
     * Планирует добавление компонента к сущности
     * @param entity
     */
    public attach<T>(entityId: number, componentClass: ComponentClass<T>): T {
        const componentClassId = this.componentClassId(componentClass);
        const componentId = this.componentId(entityId, componentClassId);

        if (process.env['NODE_ENV'] !== 'production') {
            if (this.hasComponentClassId(componentClassId, entityId)) {
                throw new Error(
                    `Entity ${entityId} already contains a component ${componentClass.name}`
                );
            }
        }

        this.attached[entityId] |= 1 << componentClassId;

        const component = new componentClass();
        this.components.set(componentId, component);

        return component;
    }

    public get<T>(entityId: number, componentClass: ComponentClass<T>): T {
        const componentClassId = this.componentClassId(componentClass);
        const componentId = this.componentId(entityId, componentClassId);

        if (process.env['NODE_ENV'] !== 'production') {
            if (!this.hasComponentClassId(componentClassId, entityId)) {
                throw new Error(
                    `Entity ${entityId} does not contain a component ${componentClass.name}`
                );
            }
        }

        return this.components.get(componentId) as T;
    }

    public has<T>(componentClass: ComponentClass<T>, entityId: number): boolean {
        return this.hasComponentClassId(this.componentClassId(componentClass), entityId);
    }

    public detach(componentClass: ComponentClass, entityId: number): void {
        // TODO: Подумать над механизмом очистки памяти при удалении
        // компонентов. Некоторые К. ссылкаются на сложные структуры
        // и не хорошо держать ссылки на них
        const componentClassId = this.componentClassId(componentClass);

        this.detached[entityId] |= 1 << componentClassId;
    }

    public select(query: readonly ComponentClass[]): readonly EntityId[] {
        const selectResult = [];
        const queryMask = this.queryMask(query);

        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            const existsAndAddedMask = this.entities[entityId]! | this.attached[entityId]!;

            if ((existsAndAddedMask & queryMask) === queryMask) {
                selectResult.push(entityId);
            }
        }

        return selectResult;
    }

    public count(query: readonly ComponentClass[]): number {
        let counter = 0;
        const queryMask = this.queryMask(query);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            const existsAndAddedMask = this.entities[entityId]! | this.attached[entityId]!;

            if ((existsAndAddedMask & queryMask) === queryMask) {
                counter++;
            }
        }

        return counter;
    }

    public selectExcept(
        query: readonly ComponentClass[],
        exceptQuery: readonly ComponentClass[]
    ): readonly EntityId[] {
        const selectResult = [];
        const queryMask = this.queryMask(query);
        const exceptMask = this.queryMask(exceptQuery);

        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            const existsAndAddedMask = this.entities[entityId]! | this.attached[entityId]!;

            if (
                (existsAndAddedMask & queryMask) === queryMask &&
                (existsAndAddedMask & exceptMask) === 0
            ) {
                selectResult.push(entityId);
            }
        }

        return selectResult;
    }

    public onAttach(query: readonly ComponentClass[], handler: EntityChangeHandler): void {
        const queryMask = this.queryMask(query);

        this.onAttachQueries.push(queryMask);
        this.onAttachHandlers.push(handler);
    }

    public onDetach(query: readonly ComponentClass[], handler: EntityChangeHandler): void {
        const queryMask = this.queryMask(query);

        this.onDetachQueries.push(queryMask);
        this.onDetachHandlers.push(handler);
    }

    public applyChanges(): void {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of

        for (let eid = 0; eid < this.entities.length; eid++) {
            /**
             * Эта сущность могла быть изменена. Тогда обновления
             * нужно применить сразу (т.е. сразу вызвать другие обработчики),
             * в этой же итерации, чтобы не было ощущения задержки реакции
             */
            let entityTriggersHandler = false;

            /**
             * Добавленные компоненты
             */
            if (this.attached[eid] !== 0) {
                const addedMask = this.attached[eid]!;
                this.attached[eid] = 0;

                this.entities[eid] |= addedMask;

                /**
                 * Вызов подписок
                 */

                entityTriggersHandler = false;

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let si = 0; si < this.onAttachQueries.length; si++) {
                    const subsMask = this.onAttachQueries[si]!;

                    if (
                        /**
                         * Важно проверить, что интересующие подписчика компоненты
                         * были изменены именно в этой итерации
                         */
                        (subsMask & addedMask) !== 0 &&
                        (this.entities[eid]! & subsMask) === subsMask
                    ) {
                        this.onAttachHandlers[si]!(this, eid);
                        entityTriggersHandler = true;
                    }
                }

                /**
                 * Повторная обработка
                 */

                if (entityTriggersHandler) {
                    // TODO Тут правильнее было бы пройти снова по всем сущностям
                    eid--;

                    continue;
                }
            }

            /**
             * Удаленные компоненты
             */
            if (this.detached[eid] !== 0) {
                const deletedMask = this.detached[eid]!;
                this.detached[eid] = 0;

                /**
                 * Вызов подписок
                 */

                entityTriggersHandler = false;

                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let si = 0; si < this.onDetachQueries.length; si++) {
                    const subsMask = this.onDetachQueries[si]!;

                    if (
                        /**
                         * Важно проверить, что интересующие подписчика компоненты
                         * были изменены именно в этой итерации
                         */
                        (subsMask & deletedMask) !== 0 &&
                        (this.entities[eid]! & subsMask) === subsMask
                    ) {
                        this.onDetachHandlers[si]!(this, eid);
                        entityTriggersHandler = true;
                    }
                }

                this.entities[eid] &= ~deletedMask;

                /**
                 * Повторная обработка
                 */

                if (entityTriggersHandler) {
                    // TODO Тут правильнее было бы пройти снова по всем сущностям
                    eid--;

                    continue;
                }
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

        if (process.env['NODE_ENV'] !== 'production') {
            if (this.componentClasses.length === 32) {
                throw new Error('Компонентов уже 32');
            }
        }

        this.componentClasses.push(componentClass);
        return this.componentClasses.length - 1;
    }

    private hasComponentClassId(componentClassId: number, entityId: number): boolean {
        const componentClassMask = 1 << componentClassId;
        const existsAndAddedMask = this.entities[entityId]! | this.attached[entityId]!;

        return (existsAndAddedMask & componentClassMask) === componentClassMask;
    }
}
