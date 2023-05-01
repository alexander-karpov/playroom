import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { type GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player';
import { Active, GameObject, RigibBody } from '~/components';
import { Ship } from './Ship';
import { Enemy } from './Enemy';
import { Gun } from './Gun';
import { Object3D } from 'three';
import { Composite, type Engine } from 'matter-js';
import { CollisionCategory } from './CollisionCategory';
import { loadGLTF } from '~/utils/loadGLTF';
import { createBodyForObject3d } from '~/utils/createBodyForObject3d';

export class SceneSystem extends System {
    public constructor(private readonly scene: THREE.Scene, private readonly engine: Engine) {
        super();

        /**
         * Light
         */
        const ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 0.3);
        scene.add(directionalLight);

        /**
         * Background
         */
        // scene.background = Palette.sky;
    }

    public override onCreate(world: World): void {
        void loadGLTF('Spaceship1.glb').then((gltf) => {
            this.addPlayer(gltf, world);
        });
    }

    private addPlayer(gltf: GLTF, world: World) {
        const [id] = world.newEntity(Player);
        world.attach(id, Active);

        const go = world.attach(id, GameObject);
        go.object3d = new Object3D();
        go.object3d.add(gltf.scene.children[0]!);
        go.object3d.scale.multiplyScalar(0.15);
        this.scene.add(go.object3d);

        const rb = world.attach(id, RigibBody);
        rb.body = createBodyForObject3d(
            go.object3d,
            {
                isSensor: true,
                collisionFilter: {
                    category: CollisionCategory.Player,
                    mask: CollisionCategory.Projectile,
                },
            },
            6
        );
        rb.syncGameObjectRotation = false;
        Composite.add(this.engine.world, rb.body);

        const ship = world.attach(id, Ship);
        ship.turningSpeed = 3;
        ship.health = 10;
        ship.maxHealth = 10;

        const gun = world.attach(id, Gun);
        gun.targetQuery.push(Enemy);
        gun.fireRate = 4;
    }
}
