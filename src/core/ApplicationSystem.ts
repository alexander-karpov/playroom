import { Engine } from 'matter-js';
import { System, type World } from '../ecs';
import { Actor, Application } from '../components';
import { Renderer, Container } from 'pixi.js';

export class ApplicationSystem extends System {
    public override onCreate(world: World): void {
        const [, component] = world.addEntity(Application);

        component.renderer = new Renderer({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0xffffff,
            hello: true,
        });

        component.stage = new Container();

        component.physics = Engine.create({
            gravity: { x: 0, y: 0.0 }
        });

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        // @ts-expect-error
        document.body.appendChild(component.renderer.view);
    }

    public override onSimulate(world: World, delta: number): void {
        const appId = world.selectOne([Application]);
        const { physics } = world.getComponent(Application, appId);

        Engine.update(physics, delta * 1000);
    }

    public override onOutput(world: World, delta: number): void {
        const appId = world.selectOne([Application]);
        const { renderer, stage } = world.getComponent(Application, appId);

        // Ticker.shared.update(performance.now());

        for (const obj of world.select([Actor])) {
            const { graphics, body } = world.getComponent(Actor, obj);
            // graphics.position.set(graphics.position.x + delta * 600, graphics.position.y + delta * 200);
            graphics.position.set(body.position.x, body.position.y);
            graphics.rotation = body.angle;
        }

        renderer.render(stage);
    }
}
