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
    describe('getComponent', () => {
        test('Находит компонент сразу после добавления', () => {
            /**
             * Проверяет в т.ч. список добавляемых компонентов.
             * Иначе новые сущности не могут участвовать в логике
             * до применения изменений
             */

            const world = new World();
            const [e, a] = world.addEntity(CompA);

            expect(world.getComponent(CompA, e)).toBe(a);
            expect(world.hasComponent(CompA, e)).toBe(true);
        });
    });

    test('Подписка срабатывает один раз при добавлении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onAdd([CompA, CompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.addEntity(CompA);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.addComponent(CompB, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);

        world.addComponent(CompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);
    });

    test('Подписка срабатывает один раз при удалении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onDelete([CompA, CompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.addEntity(CompA);
        world.addComponent(CompB, entity);
        world.addComponent(CompC, entity);

        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.deleteComponent(CompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.deleteComponent(CompB, entity);
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

        world.onAdd([CompA, CompB], (w, e) => {
            abCalled = true;

            w.addComponent(CompC, e);
        });

        world.onAdd([CompA, CompC], (w, e) => {
            acCalled = true;
        });

        const [entity] = world.addEntity(CompA);
        world.applyChanges();

        expect(abCalled).toBe(false);
        expect(acCalled).toBe(false);

        world.addComponent(CompB, entity);
        world.applyChanges();

        expect(abCalled).toBe(true);
        expect(acCalled).toBe(true);
    });
});
