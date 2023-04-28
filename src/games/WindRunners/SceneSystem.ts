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
    public constructor(
        private readonly scene: THREE.Scene,
        private readonly camera: THREE.OrthographicCamera,
        private readonly engine: Engine
    ) {
        super();

        this.camera.zoom = 0.5;
        this.camera.updateProjectionMatrix();

        /**
         * Light
         */
        const ambientLight = new THREE.AmbientLight(0xf0f0f0); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);
    }

    public override onCreate(world: World): void {
        void loadGLTF('Spaceship1.glb').then((gltf) => {
            this.addPlayer(gltf, world);
        });
    }

    private addPlayer(gltf: GLTF, world: World) {
        const [id] = world.addEntity(Player);
        world.addComponent(Active, id);

        const go = world.addComponent(GameObject, id);
        go.object3d = new Object3D();
        go.object3d.add(gltf.scene.children[0]!);
        go.object3d.scale.multiplyScalar(0.15);
        this.scene.add(go.object3d);

        const rb = world.addComponent(RigibBody, id);
        rb.body = createBodyForObject3d(
            go.object3d,
            {
                isSensor: true,
                collisionFilter: {
                    category: CollisionCategory.Ship,
                    mask: CollisionCategory.Projectile,
                },
            },
            6
        );
        rb.syncGameObjectRotation = false;
        Composite.add(this.engine.world, rb.body);

        const ship = world.addComponent(Ship, id);
        ship.turningSpeed = 3;

        const gun = world.addComponent(Gun, id);
        gun.targetQuery.push(Enemy);
        gun.fireRate = 8;
    }
}
