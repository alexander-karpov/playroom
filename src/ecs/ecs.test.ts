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
    test('Subscription fires only once', () => {
        const world = new World();
        let calledTimes = 0;

        world.subscribe([TestCompA, TestCompB], (w, e) => {
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
});
