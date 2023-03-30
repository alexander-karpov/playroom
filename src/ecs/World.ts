import type { ComponentClass } from './ComponentClass';
import { Pool } from './Pool';

/**
 * Порядковый номер сущности в массиве.
 * Может быть переиспользовал
 */
type EntityId = number;

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
     * 0n – это свободный id
     */
    private readonly entities: number[] = [];

    private readonly componentClasses: ComponentClass[] = [];

    /**
     * Ключ - сочетание componentClassesId и entityId
     * Значение - инстанс компонента
     */
    private readonly components = new Map<EntityComponentId, Component>();

    /**
     * Ключ - componentClassesId
     * Значение - entityId
     */
    // private readonly selectOneCache: Map<QueryMask, EntityId[]> = new Map();

    /**
     * Регистрирует новую сущность (id переиспользуются)
     * @param componentClass Первый компонент новой сущности
     */
    public addEntity<T>(componentClass: ComponentClass<T>): [entityId: number, component: T] {
        // 0 - отсутствие компонентов
        const entityId = Pool.alloc(this.entities, 0);
        const component = this.addComponent(componentClass, entityId);

        return [entityId, component];
    }

    /**
     * Удаляет сущность (id переиспользуются)
     */
    public deleteEntity(entityId: number): void {
        this.entities[entityId] = 0;
    }

    /**
     * Добавляет компонент к сущности
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

        this.entities[entityId] |= 1 << componentClassId;

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

        this.entities[entityId] ^= 1 << componentClassId;
    }

    public first(query: readonly ComponentClass[]): EntityId {
        const queryMask = this.queryMask(query);

        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            if ((this.entities[entityId]! & queryMask) === queryMask) {
                return entityId;
            }
        }

        // TODO: добавить проверку id в dev-mode
        throw new Error('Entity not found');
    }

    /**
     * @deprecated Неправильно идейно
     */
    public firstComponent<T>(componentClass: ComponentClass<T>): T {
        return this.getComponent(componentClass, this.first([componentClass]));
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

    /**
     * @deprecated Хрень какая-то
     */
    public getComponents<TComponent>(
        componentClass: ComponentClass<TComponent>
    ): readonly TComponent[] {
        return this.select([componentClass]).map((id) => this.getComponent(componentClass, id));
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

console.warn(`
Нужна оптимизация. Помнить сущности, которых есть только 1 штука
или сделать метод selectOne. Такие сущности двигать наверх списка
От будет искать только первый элемент
`);
