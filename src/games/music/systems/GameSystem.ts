import { Mesh, MeshBasicMaterial, PerspectiveCamera, Scene as ThreeScene } from 'three';
import { System, type World } from '@ecs';
import { Bodies, Vector, Common, Composite, Engine, Body } from 'matter-js';
import * as bodyExtraProps from '../matterBodyExtraProps';
import { xylophone } from '@systems/AudioSystem';
import { RigibBody, MatterEngine, Scene, GameObject } from '@components';
import { Star } from '../components/Star';
import { choose } from '@utils/choose';
import { StarGeometry } from '../../../geometries/StarGeometry';
import { fib } from '@utils/fib';

export class GameSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starMat = new MeshBasicMaterial({ color: 0x00ff00 });

    public override onCreate(world: World): void {
        const [sceneId, scene] = world.addEntity(Scene);

        scene.scene = new ThreeScene();
        scene.camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

        scene.camera.position.z = 50;

        // MatterJs плохо работает с очень маленькими цифрами
        // по-этому делаем все объекты больших размеров
        scene.camera.scale.z = 0.05;

        const physEnv = world.addComponent(MatterEngine, sceneId);

        physEnv.engine = Engine.create({
            gravity: { x: 0, y: 0 },
            // Включаем засыпание в PhysicsSystem
            // Если включить тут, предметы зависнут
            enableSleeping: false,
        });

        this.createAtLeastStars(world, scene, physEnv, 32);
        this.createWalls(world, physEnv);
    }

    private createStar(
        world: World,
        scene: Scene,
        physEnv: MatterEngine,
        position: Vector,
        size: number,
        angleRad: number
    ): void {
        /**
         * Object
         */
        const [entityId, obj] = world.addEntity(GameObject);

        obj.object = new Mesh(this.starGeom, this.starMat);
        obj.object.position.set(position.x, position.y, 0);
        obj.object.matrixAutoUpdate = false;
        obj.object.rotation.z = angleRad;
        obj.object.scale.multiplyScalar(size);

        scene.scene.add(obj.object);

        /**
         * Body
         */
        const body = world.addComponent(RigibBody, entityId);
        body.body = Bodies.fromVertices(position.x, position.y, [this.starGeom.shape.getPoints()], {
            angle: angleRad,
        });
        bodyExtraProps.setEntityId(body.body, entityId);
        Body.scale(body.body, size, size);

        Composite.add(physEnv.engine.world, body.body);

        /**
         * Star
         */
        const star = world.addComponent(Star, entityId);
        star.soundName = xylophone[xylophone.length - size - 2]!;
    }

    private createAtLeastStars(
        world: World,
        scene: Scene,
        physEnv: MatterEngine,
        num: number
    ): void {
        const stars = world.select([Star]);
        const numMissing = num - stars.length;

        for (let i = 0; i < numMissing; i++) {
            this.createStar(
                world,
                scene,
                physEnv,
                Vector.create(0, 0),
                choose([fib(9), fib(10), fib(11), fib(12)]),
                Common.random(0, Math.PI * 2)
            );
        }
    }

    private createWalls(world: World, physEnv: MatterEngine): void {
        /**
         * Walls
         */

        Composite.add(physEnv.engine.world, [
            // walls
            Bodies.rectangle(0, -600, 3000, 300, { isStatic: true }),
            Bodies.rectangle(0, 600, 3000, 300, { isStatic: true }),
        ]);
    }
}
