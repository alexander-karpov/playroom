import { ComponentClass } from "./ComponentClass";
import { Pool } from "./Pool";

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
    private readonly components: Map<EntityComponentId, Component> = new Map();

    private readonly selectResult: EntityId[] = [];

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

        this.entities[entityId] |= (1 << componentClassId);

        const component = new componentClass();
        this.components.set(componentId, component);

        return component;
    }

    public getComponent<T>(componentClass: ComponentClass<T>, entityId: number): T {
        const componentClassId = this.componentClassId(componentClass);
        const componentId = this.componentId(entityId, componentClassId);

        if (!this.hasComponentClassId(componentClassId, entityId)) {
            throw new Error("Entity does not contain a component");
        }

        return this.components.get(componentId) as T;
    }

    public hasComponent<T>(componentClass: ComponentClass<T>, entityId: number): boolean {
        return this.hasComponentClassId(
            this.componentClassId(componentClass),
            entityId
        );
    }

    public deleteComponent(componentClass: ComponentClass, entityId: number): void {
        const componentClassId = this.componentClassId(componentClass);

        this.entities[entityId] ^= (1 << componentClassId);
    }


    // public selectAll(query: ComponentClass[]): readonly EntityId[] {
    //     const queryMask = this.queryMask(query);

    //     return this.select(queryMask, this.entities.length);
    // }

    // public selectOne(query: ComponentClass[]): readonly EntityId[] {
    //     const queryMask = this.queryMask(query);

    //     return this.select(queryMask, 1);;
    // }

    /**
     * Заполняет массив this.selectResult совпавщими сущностями
     * @param query Список искомых на сущности компонентов
     * @returns Ссылка на this.selectResult
     */
    public select(query: ComponentClass[]): readonly EntityId[] {
        const queryMask = this.queryMask(query);

        this.selectResult.length = 0;

        for (let entityId = 0; entityId < this.entities.length; entityId++) {
            if ((this.entities[entityId]! & queryMask) === queryMask) {
                this.selectResult.push(entityId);
            }
        }

        return this.selectResult;
    }

    /**
     * Возвращает общую маску компонентов
     */
    private queryMask(query: ComponentClass<unknown>[]): QueryMask {
        let mask = 0;

        for (let i = 0; i < query.length; i++) {
            mask |= (1 << this.componentClassId(query[i]!));
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

        if (this.componentClasses.length === 32) {
            throw new Error("Компонентов уже 32");
        }

        this.componentClasses.push(componentClass);
        return this.componentClasses.length - 1;
    }

    public hasComponentClassId(componentClassId: number, entityId: number): boolean {
        const componentClassMask = (1 << componentClassId);

        return (this.entities[entityId]! & componentClassMask) === componentClassMask;
    }
}
