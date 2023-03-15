import { System, type World } from '../ecs';
import { Application, Actor, Pointer, Player, Camera } from '../components';
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

        function player(x: number, y: number, r: number, color: number): void {
            const [playerId,] = world.addEntity(Player);
            const actor = world.addComponent(Actor, playerId);

            actor.graphics = new Graphics().beginFill(color).drawCircle(0, 0, r);
            // actor.graphics.pivot.set(r / 2, h / 2);
            actor.graphics.position.set(x, y);
            actor.body = Bodies.circle(x, y, r);
        }

        player(0, 0, 16, 0);

        for (let i = 1; i < 7; i++) {
            box(64 * i * 0.7, 64 * 6 - 64 * i, 64, 64, rc());
        }
    }

    public override onLink(world: World): void {
        const appId = world.first([Application]);
        const { stage, physics } = world.getComponent(Application, appId);

        const actors = world.selectComponents(Actor);

        stage.addChild(...actors.map(a => a.graphics));
        Composite.add(physics.world, actors.map(a => a.body));
    }

    public override onInput(world: World, delta: number): void {
        const pointer = world.getComponent(Pointer, world.first([Pointer]));
        const camera = world.firstComponent(Camera);
        const { stage } = world.firstComponent(Application);

        const playerId = world.first([Player]);
        const { body } = world.getComponent(Actor, playerId);

        if (pointer.pressed) {
            const worldX = pointer.position.x - stage.position.x + camera.position.x;
            const worldY = pointer.position.y - stage.position.y + camera.position.y;

            const dir = Vector.normalise(Vector.sub(Vector.create(worldX, worldY), body.position));
            console.log({ dir: JSON.stringify(dir) });
            Body.applyForce(body, body.position, Vector.mult(dir, delta * 0.0001));
        }
    }
}


console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);