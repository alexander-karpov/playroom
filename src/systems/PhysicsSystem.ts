import { Body, Composite, Engine, Vector } from 'matter-js';
import { System, type World } from '@ecs';
import { RigibBody } from '@components/RigibBody';
import { GameObject } from '@components/GameObject';
import { MatterEngine as MatterEngine } from '@components/MatterEngine';

export class PhysicsSystem extends System {
    // public override onCreate(world: World): void {
    //     const [, app] = world.addEntity(Application);
    //     app.renderer = new Renderer({
    //         width: window.innerWidth,
    //         height: window.innerHeight,
    //         backgroundColor: 0xffffff,
    //         hello: true,
    //     });
    //     app.scene = new Container();
    //     app.physics = Engine.create({
    //         gravity: { x: 0, y: 0.0 },
    //     });
    //     app.scene.position.x = app.renderer.width / 2;
    //     app.scene.position.y = app.renderer.height / 2;
    //     document.body.style.margin = '0';
    //     document.body.style.overflow = 'hidden';
    //     // @ts-expect-error
    //     document.body.appendChild(app.renderer.view);
    //     /**
    //      * Create camera
    //      */
    //     const [, camera] = world.addEntity(Camera);
    //     camera.position = Vector.create(0, 0);
    // }
    // public override onOutput(world: World, delta: number): void {
    //     const { renderer, scene: stage, physics } = world.firstComponent(Application);
    //     /**
    //      * Update physics
    //      */
    //     Engine.update(physics, delta);
    //     /**
    //      * Sync bodies position
    //      */
    //     for (const obj of world.select([Actor])) {
    //         const { graphics, body } = world.getComponent(Actor, obj);
    //         // graphics.position.set(graphics.position.x + delta * 0.3, graphics.position.y + delta * 0.06);
    //         graphics.position.set(body.position.x, body.position.y);
    //         graphics.rotation = body.angle;
    //     }
    //     /**
    //      * Update viewport according to camera
    //      */
    //     const camera = world.getComponent(Camera, world.first([Camera]));
    //     stage.pivot.set(camera.position.x, camera.position.y);
    //     /**
    //      * Render
    //      */
    //     // this.renderDust(world);
    //     renderer.render(stage, {
    //         clear: false,
    //     });
    // }

    public override onSync(world: World, deltaS: number): void {
        const deltaMs = deltaS * 1000;
        const physEnvIds = world.select([MatterEngine]);

        for (const id of physEnvIds) {
            const physEnv = world.getComponent(MatterEngine, id);

            Engine.update(physEnv.engine, deltaMs);
        }

        const bodyIds = world.select([RigibBody, GameObject]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < bodyIds.length; i++) {
            const id = bodyIds[i]!;

            const { body } = world.getComponent(RigibBody, id);
            const { object } = world.getComponent(GameObject, id);

            if (!body.isSleeping && !body.isStatic) {
                object.position.set(body.position.x, body.position.y, 0);
                object.rotation.z = body.angle;
                object.updateMatrix();
            }
        }
    }

    public override onSometimes(world: World): void {
        for (const id of world.select([MatterEngine])) {
            const { engine } = world.getComponent(MatterEngine, id);
            /**
             * Почему-то если засыплять объекты сразу, они просто зависают
             */
            engine.enableSleeping = true;
        }
    }
}
