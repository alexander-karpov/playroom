import { System, type World } from '../ecs';
import { Application, Box } from '../components';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Engine, Bodies, Composite } from 'matter-js';

const engine = Engine.create();


export class SceneSystem extends System {
    public override onCreate(world: World): void {
        // FIXME Наверное тут стоит добавлять уже созданный компонент
        const [, component] = world.addEntity(Box);

        const graphics = new PixiGraphics();
        graphics.beginFill(0xff0000);
        graphics.drawRect(0, 0, 64, 64);

        component.graphics = graphics;


        const box = Bodies.rectangle(0, 0, 64, 64);


        component.body = box;

        Composite.add(engine.world, [box,
            Bodies.rectangle(-30, 30, 64, 64),
            Bodies.rectangle(200, 610, 810, 60, { isStatic: true })]);

        console.log(engine);
    }

    public override onLink(world: World): void {
        // FIXME Добавить метод для поиска одной сущности
        const appId = world.select([Application])[0]!;
        const { app } = world.getComponent(Application, appId);

        for (const obj of world.select([Box])) {
            app!.stage.addChild(
                world.getComponent(Box, obj).graphics!
            );
        }
    }

    public override onSimulate(world: World, delta: number): void {
        Engine.update(engine, delta * 1000);

        for (const obj of world.select([Box])) {
            const { graphics, body } = world.getComponent(Box, obj);
            graphics!.position.set(body!.position.x, body!.position.y);
            graphics!.rotation = body!.angle;
        }
    }
}
