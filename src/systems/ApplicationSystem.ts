import { Composite, Engine, Mouse, Vector } from 'matter-js';
import { System, type World } from '@ecs';
import { Actor, Application, Camera } from '@components';
import { Renderer, Container } from 'pixi.js';

export class ApplicationSystem extends System {
    public override onCreate(world: World): void {
        const [, app] = world.addEntity(Application);

        /**
         * Renderer
         */
        app.renderer = new Renderer({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x808080,
            hello: true,
        });

        app.stage = new Container();

        app.stage.position.x = app.renderer.width / 2;
        app.stage.position.y = app.renderer.height / 2;

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        // @ts-expect-error
        document.body.appendChild(app.renderer.view);

        /**
         * Physics
         */
        app.physics = Engine.create({
            gravity: { x: 0, y: 0.0 },
        });

        /**
         * Camera
         */
        const [, camera] = world.addEntity(Camera);
        camera.position = Vector.create(0, 0);

        /**
         * Mouse
         */
        app.mouse = Mouse.create(app.renderer.view as unknown as HTMLElement);
        Mouse.setOffset(app.mouse, Vector.mult(app.stage.position, -1));
    }

    public override onLink(world: World): void {
        /**
         * Add actors to world
         */
        const actors = world.getComponents(Actor);
        const { stage, physics } = world.firstComponent(Application);

        stage.addChild(...actors.map((a) => a.graphics));

        Composite.add(
            physics.world,
            actors.map((a) => a.body)
        );
    }

    public override onOutput(world: World, delta: number): void {
        const { renderer, stage, physics, mouse } =
            world.firstComponent(Application);

        /**
         * Update physics
         */
        Engine.update(physics, delta);

        /**
         * Sync bodies position
         */
        for (const obj of world.select([Actor])) {
            const { graphics, body } = world.getComponent(Actor, obj);
            graphics.position.set(body.position.x, body.position.y);
            graphics.rotation = body.angle;
        }

        /**
         * Updates according to camera
         */
        const camera = world.getComponent(Camera, world.first([Camera]));
        stage.pivot.set(camera.position.x, camera.position.y);

        /**
         * Render
         */
        renderer.render(stage);
    }
}

console.warn(`
Нужно использовать ProjectionSystem что управления камерой
чтобы получить все возможности: масштабирование, наклон, всё такое
`);
