import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Player } from './Player';
import { Active, GameObject, RigibBody } from '~/components';
import { Ship } from './Ship';
import { Enemy } from './Enemy';
import { Hitable } from './Hitable';
import { Bits } from '~/utils/Bits';
import { CollisionMasks } from './CollisionMasks';
import { Gun } from './Gun';
import { Object3D, Vector3 } from 'three';
import type { IBodyDefinition } from 'matter-js';
import { Bodies, Composite, type Engine } from 'matter-js';

export class SceneSystem extends System {
    private readonly gltfLoader = new GLTFLoader();
    private readonly tempBox3 = new THREE.Box3();
    private readonly tempVec3 = new THREE.Vector3();

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
        void this.loadModel('Spaceship1.glb').then((gltf) => {
            this.addPlayer(gltf, world);
        });

        void this.loadModel('Spaceship4.glb').then((gltf) => {
            this.addEnemy(gltf, world);
            this.addEnemy(gltf, world);
            this.addEnemy(gltf, world);
            this.addEnemy(gltf, world);
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
        rb.body = this.createBodyForObject3d(go.object3d, { isSensor: false }, 6);
        rb.syncRotation = false;
        Composite.add(this.engine.world, rb.body);

        const airplane = world.addComponent(Ship, id);
        airplane.turningSpeed = 3;

        const hitable = world.addComponent(Hitable, id);
        hitable.mask = Bits.bit(CollisionMasks.Player);
        hitable.health = 10;
        new THREE.Box3().setFromObject(go.object3d).getBoundingSphere(hitable.sphere);

        const gun = world.addComponent(Gun, id);
        gun.targetMask = Bits.bit(CollisionMasks.Enemy);
        gun.fireRateInSec = 8;
    }

    private createBodyForObject3d(
        object3d: THREE.Object3D,
        options: IBodyDefinition,
        maxSides: number
    ) {
        this.tempBox3.setFromObject(object3d);
        this.tempBox3.getSize(this.tempVec3);
        const maxSide = Math.max(this.tempVec3.x, this.tempVec3.y, this.tempVec3.z);

        return Bodies.circle(0, 0, maxSide / 2, options, maxSides);
    }

    private addEnemy(gltf: GLTF, world: World) {
        const [id, enemy] = world.addEntity(Enemy);
        world.addComponent(Active, id);
        enemy.untilTurnSec = 1 + Math.random() * 3;
        const go = world.addComponent(GameObject, id);

        go.object3d = new Object3D();
        go.object3d.add(gltf.scene.clone());
        go.object3d.scale.multiplyScalar(0.2);
        go.object3d.position.set(200 * Math.random(), 200 * Math.random(), 0);

        this.scene.add(go.object3d);

        const rb = world.addComponent(RigibBody, id);
        rb.body = this.createBodyForObject3d(go.object3d, { isSensor: false }, 6);
        rb.syncRotation = false;
        Composite.add(this.engine.world, rb.body);

        const airplane = world.addComponent(Ship, id);
        airplane.direction.applyAxisAngle(new Vector3(0, 0, 1), Math.random() * Math.PI);
        airplane.turningSpeed = 3;

        const hitable = world.addComponent(Hitable, id);
        hitable.mask = Bits.bit(CollisionMasks.Enemy);
        hitable.health = 10;
        new THREE.Box3().setFromObject(go.object3d).getBoundingSphere(hitable.sphere);

        const gun = world.addComponent(Gun, id);
        gun.targetMask = Bits.bit(CollisionMasks.Player);
        gun.fireRateInSec = 1;
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
