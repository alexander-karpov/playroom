import { describe, expect, test } from '@jest/globals';
import { World } from '.';

class TestCompA {
    public foo!: number;
}

class TestCompB {
    public bar!: number;
}

class TestCompC {
    public baz!: number;
}

describe('ECS / World', () => {
    test('Подписка срабатывает один раз при добавлении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onAdd([TestCompA, TestCompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.addEntity(TestCompA);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.addComponent(TestCompB, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);

        world.addComponent(TestCompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(1);
    });

    test('Подписка срабатывает один раз при удалении', () => {
        const world = new World();
        let calledTimes = 0;

        world.onDelete([TestCompA, TestCompB], (w, e) => {
            calledTimes++;
        });

        const [entity] = world.addEntity(TestCompA);
        world.addComponent(TestCompB, entity);
        world.addComponent(TestCompC, entity);

        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.deleteComponent(TestCompC, entity);
        world.applyChanges();

        expect(calledTimes).toBe(0);

        world.deleteComponent(TestCompB, entity);
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

        world.onAdd([TestCompA, TestCompB], (w, e) => {
            abCalled = true;

            w.addComponent(TestCompC, e);
        });

        world.onAdd([TestCompA, TestCompC], (w, e) => {
            acCalled = true;
        });

        const [entity] = world.addEntity(TestCompA);
        world.applyChanges();

        expect(abCalled).toBe(false);
        expect(acCalled).toBe(false);

        world.addComponent(TestCompB, entity);
        world.applyChanges();

        expect(abCalled).toBe(true);
        expect(acCalled).toBe(true);
    });
});
