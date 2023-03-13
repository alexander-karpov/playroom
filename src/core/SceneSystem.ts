import { System, type World } from '../ecs';
import { Application, Actor, Pointer } from '../components';
import { Graphics } from 'pixi.js';
import { Engine, Bodies, Composite, Body, Vector } from 'matter-js';


export class SceneSystem extends System {
    public override onCreate(world: World): void {
        function rc(): number {
            return Math.random() * 0xffffff;
        }

        function box(x: number, y: number, w: number, h: number, color: number, isStatic: boolean = false): void {
            const [, component] = world.addEntity(Actor);

            component.graphics = new Graphics().beginFill(color).drawRect(0, 0, w, h);
            component.graphics.pivot.set(w / 2, h / 2);
            component.graphics.position.set(x, y);
            component.body = Bodies.rectangle(x, y, w, h, { isStatic });
        }

        box(0, 0, 64, 64, 0, false);

        for (let i = 1; i < 7; i++) {
            box(64 * i * 0.7, 64 * 6 - 64 * i, 64, 64, rc());
        }
    }

    public override onLink(world: World): void {
        const appId = world.selectOne([Application]);
        const { pixi, physics } = world.getComponent(Application, appId);

        const actors = world.selectComponents(Actor);

        pixi.stage.addChild(...actors.map(a => a.graphics));
        Composite.add(physics.world, actors.map(a => a.body));
    }

    public override onInput(world: World, delta: number): void {
        const pointer = world.getComponent(Pointer, world.selectOne([Pointer]));

        const staticId = world.selectOne([Actor]);
        const { body } = world.getComponent(Actor, staticId);

        const dir = Vector.normalise(Vector.sub(pointer.position, body.position));

        if (pointer.pressed) {
            Body.applyForce(body, body.position, Vector.mult(dir, delta * 0.1));
        }
    }
}


console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);