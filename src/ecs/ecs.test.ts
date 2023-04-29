import { describe, expect, test } from '@jest/globals';
import { World } from '.';

class CompA {
    public foo!: number;
}

class CompB {
    public bar!: number;
}

class CompC {
    public baz!: number;
}

describe('ECS / World', () => {
    describe('Компоненты', () => {
        test('Добавляет и удаляет компонент', () => {
            /**
             * Проверяет в т.ч. список добавляемых компонентов.
             * Иначе новые сущности не могут участвовать в логике
             * до применения изменений
             */

            const world = new World();

            const [e] = world.newEntity(CompA);

            expect(world.has(CompA, e)).toBe(true);
            expect(world.has(CompB, e)).toBe(false);

            world.applyChanges();

            expect(world.has(CompA, e)).toBe(true);
            expect(world.has(CompB, e)).toBe(false);

            world.attach(CompB, e);

            expect(world.has(CompB, e)).toBe(true);

            world.applyChanges();

            expect(world.has(CompB, e)).toBe(true);

            world.detach(CompB, e);

            expect(world.has(CompB, e)).toBe(true);

            world.applyChanges();

            expect(world.has(CompB, e)).toBe(false);
        });

        test('Добавляет и удаляет компонент из обработчика', () => {
            /**
             * Проверяет в т.ч. список добавляемых компонентов.
             * Иначе новые сущности не могут участвовать в логике
             * до применения изменений
             */

            const world = new World();

            world.onAttach([CompA], (w, e) => {
                world.attach(CompB, e);
                world.detach(CompB, e);
            });

            const [e] = world.newEntity(CompA);

            world.applyChanges();

            expect(world.has(CompB, e)).toBe(false);
        });
    });

    describe('Подписки', () => {
        test('Находит компонент сразу после добавления', () => {
            /**
             * Проверяет в т.ч. список добавляемых компонентов.
             * Иначе новые сущности не могут участвовать в логике
             * до применения изменений
             */

            const world = new World();
            const [e, a] = world.newEntity(CompA);

            expect(world.get(CompA, e)).toBe(a);
            expect(world.has(CompA, e)).toBe(true);
        });
    });

    describe('Запросы', () => {
        test('Исключающий запрос', () => {
            /**
             * Проверяет в т.ч. список добавляемых компонентов.
             * Иначе новые сущности не могут участвовать в логике
             * до применения изменений
             */

            const world = new World();
            const [id, a] = world.newEntity(CompA);
            world.attach(CompB, id);

            const idsExceptB = world.selectExcept([CompA], [CompB]);
            expect(idsExceptB).not.toContain(id);

            const idsExceptC = world.selectExcept([CompA, CompB], [CompC]);
            expect(idsExceptC).toContain(id);
        });
    });

    test('Подписка срабатывает один раз при добавлении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onAttach([CompA, CompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.newEntity(CompA);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.attach(CompB, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);

        world.attach(CompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);
    });

    test('Подписка срабатывает один раз при удалении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onDetach([CompA, CompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.newEntity(CompA);
        world.attach(CompB, entity);
        world.attach(CompC, entity);

        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.detach(CompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.detach(CompB, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);
    });

    test('Цепочка обновлений на одной сущности должна выполняться в одном кадре', () => {
        /**
         * Если откладывать цепучку собыний на одной сущности
         * на следующие кадры, это создаёт впечатление задержки реакции
         */

        const world = new World();
        let abCalled = false;
        let acCalled = false;

        world.onAttach([CompA, CompB], (w, e) => {
            abCalled = true;

            w.attach(CompC, e);
        });

        world.onAttach([CompA, CompC], (w, e) => {
            acCalled = true;
        });

        const [entity] = world.newEntity(CompA);
        world.applyChanges();

        expect(abCalled).toBe(false);
        expect(acCalled).toBe(false);

        world.attach(CompB, entity);
        world.applyChanges();

        expect(abCalled).toBe(true);
        expect(acCalled).toBe(true);
    });
});
