import { Engine, Vector } from 'matter-js';
import { System, type World } from '@ecs';
import { Actor, Application, Camera, Dust } from '../components';
import { Renderer, Container } from 'pixi.js';

export class ApplicationSystem extends System {
    public override onCreate(world: World): void {
        const [, app] = world.addEntity(Application);

        app.touchedStarEntities = [];

        app.renderer = new Renderer({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0xffffff,
            hello: true,
        });

        app.stage = new Container();

        app.physics = Engine.create({
            gravity: { x: 0, y: 0.0 }
        });

        app.stage.position.x = app.renderer.width / 2;
        app.stage.position.y = app.renderer.height / 2;

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        // @ts-expect-error
        document.body.appendChild(app.renderer.view);

        /**
         * Create camera
         */
        const [, camera] = world.addEntity(Camera);
        camera.position = Vector.create(0, 0);
    }

    public override onOutput(world: World, delta: number): void {
        const { renderer, stage, physics } = world.getComponent(Application, world.first([Application]));

        /**
         * Update physics
         */
        Engine.update(physics, delta);

        /**
         * Sync bodies position
         */
        for (const obj of world.select([Actor])) {
            const { graphics, body } = world.getComponent(Actor, obj);
            // graphics.position.set(graphics.position.x + delta * 0.3, graphics.position.y + delta * 0.06);
            graphics.position.set(body.position.x, body.position.y);
            graphics.rotation = body.angle;
        }

        /**
         * Update viewport according to camera
         */
        const camera = world.getComponent(Camera, world.first([Camera]));
        stage.pivot.set(camera.position.x, camera.position.y);

        /**
         * Render
         */
        // this.renderDust(world);

        renderer.render(stage, {
            clear: false
        });
    }
}

console.warn(`
Нужно использовать ProjectionSystem что управления камерой
чтобы получить все возможности: масштабирование, наклон, всё такое
`);