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
import { SoundTrack } from '~/systems/AudioSystem';
import { Explosion } from './Explosion';

export class SceneSystem extends System {
    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();

        /**
         * Light
         */
        const ambientLight = new THREE.AmbientLight(0x444444); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 0.5);
        scene.add(directionalLight);

        /**
         * Background
         */
        // scene.background = Palette.sky;

        void loadGLTF('Spaceship1.glb').then((gltf) => {
            this.addPlayer(gltf, this.world);
        });
    }

    private addPlayer(gltf: GLTF, world: World) {
        const [id] = world.newEntity(Player);
        world.attach(id, Active);

        const go = world.attach(id, GameObject);
        go.object3d = new Object3D();
        go.object3d.add(gltf.scene.children[0]!);
        go.object3d.scale.multiplyScalar(0.16);
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
        ship.health = 10;
        ship.maxHealth = 10;
        ship.turningSpeed = 3.5;

        const gun = world.attach(id, Gun);
        gun.targetQuery.push(Enemy);
        gun.fireRate = 8;
        gun.sound = SoundTrack.XWingBaster01;
    }
}
