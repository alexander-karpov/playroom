import { System, type World } from '../ecs';
import { Application, Actor, Pointer } from '../components';
import { Graphics } from 'pixi.js';
import { Engine, Bodies, Composite, Body } from 'matter-js';


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

        box(0, 0, 64, 64, rc());


        for (let i = 1; i < 7; i++) {
            box(64 * i * 0.7, 64 * 6 - 64 * i, 64, 64, rc());
        }
    }

    public override onLink(world: World): void {
        const appId = world.selectOne([Application]);
        const { pixi, physics } = world.getComponent(Application, appId);

        const actors = world.selectComponents(Actor);

        pixi!.stage.addChild(...actors.map(a => a.graphics!));
        Composite.add(physics!.world, actors.map(a => a.body!));
    }

    public override onInput(world: World, _delta: number): void {
        const pointer = world.getComponent(Pointer, world.selectOne([Pointer]));

        const staticId = world.selectOne([Actor]);
        const { body } = world.getComponent(Actor, staticId);

        Body.setPosition(body!, pointer.position);
    }

    public override onSimulate(world: World, delta: number): void {



        // Body.setAngle(body!, body!.angle + delta * 0.2);

        const appId = world.selectOne([Application]);
        const { physics } = world.getComponent(Application, appId);

        Engine.update(physics!, delta * 1000);
    }

    public override onOutput(world: World, delta: number): void {
        for (const obj of world.select([Actor])) {
            const { graphics, body } = world.getComponent(Actor, obj);
            graphics!.position.set(body!.position.x, body!.position.y);
            graphics!.rotation = body!.angle;
        }
    }
}
