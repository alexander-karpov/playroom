import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';
import { Bits } from '~/utils/Bits';
import { CollisionMasks } from './CollisionMasks';

export class SceneSystem extends System {
    private readonly gltfLoader = new GLTFLoader();

    public constructor(private readonly scene: THREE.Scene) {
        super();

        /**
         * Light
         */
        const ambientLight = new THREE.AmbientLight(0xf0f0f0); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);
    }

    public override onCreate(world: World): void {
        void this.loadModel('Spaceship1.glb').then((gltf) => {
            this.addPlayer(gltf, world);
        });

        void this.loadModel('Spaceship4.glb').then((gltf) => {
            this.addEnemy(gltf, world);
        });
    }

    private addPlayer(gltf: GLTF, world: World) {
        this.scene.add(gltf.scene);

        const [id] = world.addEntity(Player);

        const go = world.addComponent(GameObject, id);
        go.object3d = gltf.scene;
        go.object3d.scale.multiplyScalar(0.1);

        const airplane = world.addComponent(Airplane, id);
        airplane.direction = new THREE.Vector3(1, 0, 0);
        airplane.speed = 500;
        airplane.turningSpeed = 4;

        const hitable = world.addComponent(Hitable, id);
        hitable.collisionMask = Bits.bit(CollisionMasks.Player);
        new THREE.Box3().setFromObject(go.object3d).getBoundingSphere(hitable.sphere);
    }

    private addEnemy(gltf: GLTF, world: World) {
        this.scene.add(gltf.scene);

        const [id] = world.addEntity(Enemy);
        const go = world.addComponent(GameObject, id);

        go.object3d = gltf.scene;
        go.object3d.scale.multiplyScalar(0.15);
        go.object3d.position.set(300, 300, 0);

        const airplane = world.addComponent(Airplane, id);
        airplane.direction = new THREE.Vector3(1, 0, 0);
        airplane.speed = 600;
        airplane.turningSpeed = 4;

        const hitable = world.addComponent(Hitable, id);
        hitable.collisionMask = Bits.bit(CollisionMasks.Enemy);
        new THREE.Box3().setFromObject(go.object3d).getBoundingSphere(hitable.sphere);
    }

    private loadModel(filename: string): Promise<GLTF> {
        return new Promise<GLTF>((resolve, reject) => {
            this.gltfLoader.load(
                `./assets/models/${filename}`,
                resolve,
                function onProgress() {},
                reject
            );
        });
    }
}
