import * as THREE from 'three';
import { System, type World } from '@ecs';
import { Bodies, Vector, Common, Composite, Engine, Body } from 'matter-js';
import * as extraProps from '../extraProps';
import { SoundTracks } from '@systems/AudioSystem';
import { RigibBody, MatterEngine, Scene, GameObject, Active, Sound } from '@components';
import { Star } from '../components/Star';
import { choose } from '@utils/choose';
import { StarGeometry } from '../../../geometries/StarGeometry';
import { fib } from '@utils/fib';

export class GameSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly raycaster = new THREE.Raycaster();
    private readonly colorMats = new Map<number, THREE.MeshBasicMaterial>();

    public override onCreate(world: World): void {
        const [sceneId, scene] = world.addEntity(Scene);
        world.addComponent(Active, sceneId);

        scene.scene = new THREE.Scene();
        scene.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

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

        window.addEventListener('pointerdown', this.onPointerDown.bind(this, world));
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
                choose(Object.values(SoundTracks))!,
                Common.random(0, Math.PI * 2)
            );
        }
    }

    private createStar(
        world: World,
        scene: Scene,
        physEnv: MatterEngine,
        position: Vector,
        size: number,
        soundtrack: SoundTracks,
        angleRad: number
    ): void {
        /**
         * Object
         */
        const [entityId, obj] = world.addEntity(GameObject);

        obj.object = new THREE.Mesh(this.starGeom, this.getOrCreateColorMaterial(0x00ff00));
        obj.object.position.set(position.x, position.y, 0);
        obj.object.matrixAutoUpdate = false;
        obj.object.rotation.z = angleRad;
        obj.object.scale.multiplyScalar(size);
        extraProps.setEntityId(obj.object.userData, entityId);

        scene.scene.add(obj.object);

        /**
         * Body
         */
        const body = world.addComponent(RigibBody, entityId);
        body.body = Bodies.fromVertices(position.x, position.y, [this.starGeom.shape.getPoints()], {
            angle: angleRad,
        });
        extraProps.setEntityId(body.body.plugin, entityId);
        Body.scale(body.body, size, size);

        Composite.add(physEnv.engine.world, body.body);

        /**
         * Star
         */
        const star = world.addComponent(Star, entityId);
        star.soundtrack = soundtrack;
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

    private getOrCreateColorMaterial(color: number): THREE.MeshBasicMaterial {
        if (!this.colorMats.has(color)) {
            this.colorMats.set(color, new THREE.MeshBasicMaterial({ color }));
        }

        return this.colorMats.get(color)!;
    }

    private onPointerDown(world: World, event: MouseEvent): void {
        const pointer = new THREE.Vector2();
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Iterate over all scenes using for-of loop
        for (const id of world.select([Scene, Active])) {
            const { camera, scene } = world.getComponent(Scene, id);

            this.raycaster.setFromCamera(pointer, camera);

            const intersects = this.raycaster.intersectObjects(scene.children);

            for (const { object } of intersects) {
                if (!isMesh(object)) {
                    continue;
                }
                const entityId = extraProps.entityId(object.userData);

                if (entityId == null) {
                    continue;
                }

                const star = world.getComponent(Star, entityId);

                object.material = this.getOrCreateColorMaterial(0xff0000);
                const [, sound] = world.addEntity(Sound);
                sound.name = star.soundtrack;
                sound.throttleMs = 0;
            }
        }
    }
}

function isMesh(object: THREE.Object3D): object is THREE.Mesh {
    return object.type === 'Mesh';
}
