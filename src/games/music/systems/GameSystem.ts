import { Mesh, MeshBasicMaterial, PerspectiveCamera, Scene as ThreeScene } from 'three';
import { System, type World } from '@ecs';
import { Bodies, Vector, Common, Composite, Engine, Body } from 'matter-js';
import * as bodyExtraProps from '../matterBodyExtraProps';
import { xylophone } from '@systems/AudioSystem';
import { RigibBody, PhysicsEnv, Scene, VisualForm } from '@components';
import { Star } from '../components/Star';
import { choose } from '@utils/choose';
import { StarGeometry } from '../../../geometries/StarGeometry';

export class GameSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starMat = new MeshBasicMaterial({ color: 0x00ff00 });

    public override onCreate(world: World): void {
        const [sceneId, scene] = world.addEntity(Scene);

        scene.scene = new ThreeScene();
        scene.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

        scene.camera.position.z = 50;

        const physEnv = world.addComponent(PhysicsEnv, sceneId);

        physEnv.engine = Engine.create({
            gravity: { x: 0, y: -0.1 },
        });

        this.createAtLeastStars(world, scene, physEnv, 10);
        this.createWalls(world, physEnv);
    }

    private createStar(
        world: World,
        scene: Scene,
        physEnv: PhysicsEnv,
        position: Vector,
        size: number,
        angleRad: number
    ): void {
        const [entityId, form] = world.addEntity(VisualForm);
        form.object3d = new Mesh(this.starGeom, this.starMat);
        form.object3d.position.set(position.x, position.y, 0);
        scene.scene.add(form.object3d);

        const body = world.addComponent(RigibBody, entityId);
        body.body = Bodies.fromVertices(position.x, position.y, [
            this.starGeom.shape.getPoints(),
            // starShape(10, 0)[1],
        ]);
        bodyExtraProps.setEntityId(body.body, entityId);
        // Body.setMass(body.body, 500);
        Composite.add(physEnv.engine.world, body.body);

        const star = world.addComponent(Star, entityId);
        star.soundName = xylophone[xylophone.length - size - 2]!;

        // Body.setAngle(actor.body, angleRad);
        // actor.graphics.rotation = angleRad;
    }

    private createAtLeastStars(world: World, scene: Scene, physEnv: PhysicsEnv, num: number): void {
        const stars = world.select([Star]);
        const numMissing = num - stars.length;

        for (let i = 0; i < numMissing; i++) {
            this.createStar(
                world,
                scene,
                physEnv,
                Vector.create(0, 0),
                choose([1, 2, 3, 4]),
                Common.random(0, Math.PI * 2)
            );
        }
    }

    private createWalls(world: World, physEnv: PhysicsEnv): void {
        /**
         * Walls
         */

        Composite.add(physEnv.engine.world, [
            // walls
            Bodies.rectangle(0, -20, 100, 3, { isStatic: true }),
        ]);
    }
}
