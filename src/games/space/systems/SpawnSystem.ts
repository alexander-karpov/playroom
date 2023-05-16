import { System, type World } from '~/ecs';
import { Player } from '../components/Player';
import { Active, GameObject, RigibBody } from '~/games/space/components';
import { Composite, type Engine, Body, Vector } from 'matter-js';
import { Enemy } from '../components/Enemy';
import * as THREE from 'three';
import { loadGLTF } from '~/utils/loadGLTF';
import { Ship } from '../components/Ship';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { createBodyForObject3d } from '~/utils/createBodyForObject3d';
import { CollisionCategory } from '../CollisionCategory';
import { Gun } from '../components/Gun';
import { ObjectPoolHelper } from '../ObjectPoolHelper';
import { SoundTrack } from '~/games/space/systems/AudioSystem';

/**
 * Спавним врагов:
 *  - чем дальше от стартовой точки тем больше их количество
 */
export abstract class SpawnSystem extends System {
    private model?: THREE.Object3D;

    public constructor(
        protected readonly world: World,
        protected readonly scene: THREE.Scene,
        protected readonly engine: Engine
    ) {
        super();

        void loadGLTF('Spaceship5.glb').then((gltf) => {
            this.model = gltf.scene.children[0];
        });

        setInterval(() => {
            this.spawn();
        }, 10000);
    }

    @System.on([Player, Active])
    private onPlayerActive(world: World, id: number) {
        for (const id of this.world.select([Enemy])) {
            ObjectPoolHelper.deactivate(world, this.engine, id);
        }

        this.spawn();
    }

    private spawnEnemy() {
        if (!this.model) {
            return;
        }

        const id = this.findUnusedOrCreate(this.model);
        this.reconfigure(id);

        ObjectPoolHelper.activate(this.world, this.engine, id);
    }

    private findUnusedOrCreate(originalModel: THREE.Object3D): number {
        for (const id of this.world.selectExcept([Enemy], [Active])) {
            return id;
        }

        return this.createEnemy(originalModel);
    }

    private spawn() {
        for (const id of this.world.selectExcept([Player], [Active])) {
            return;
        }

        const expectedEnemies = this.difficulty();
        const activeEnemies = this.world.count([Enemy, Active]);
        const missing = expectedEnemies - activeEnemies;

        for (let i = 0; i < missing; i++) {
            this.spawnEnemy();
        }
    }

    private reconfigure(id: number) {
        const { body } = this.world.get(id, RigibBody);
        const ship = this.world.get(id, Ship);

        ship.health = ship.maxHealth;

        for (const playerId of this.world.select([Player, Active])) {
            const { body: playerBody } = this.world.get(playerId, RigibBody);
            const playerShip = this.world.get(playerId, Ship);

            Body.setPosition(
                body,
                Vector.add(
                    playerBody.position,
                    Vector.mult(
                        Vector.rotate(playerShip.direction, THREE.MathUtils.randFloatSpread(2)),
                        2000
                    )
                )
            );
        }
    }

    private createEnemy(originalModel: THREE.Object3D): number {
        /**
         * Enemy
         */
        const [id, enemy] = this.world.newEntity(Enemy);
        enemy.turnDelaySec = THREE.MathUtils.randFloat(1, 3);

        /**
         * GameObject
         */
        const go = this.world.attach(id, GameObject);
        go.object3d = SkeletonUtils.clone(originalModel);
        go.object3d.scale.multiplyScalar(0.17);
        go.object3d.position.set(0, 0, 0);
        this.scene.add(go.object3d);

        /**
         * RigibBody
         */
        const rb = this.world.attach(id, RigibBody);
        rb.body = createBodyForObject3d(
            go.object3d,
            {
                isSensor: true,
                collisionFilter: {
                    category: CollisionCategory.Enemy,
                    mask: CollisionCategory.Projectile,
                },
            },
            6
        );

        rb.syncGameObjectRotation = false;
        Composite.add(this.engine.world, rb.body);

        /**
         * Ship
         */
        const ship = this.world.attach(id, Ship);
        ship.turningSpeed = 1;
        ship.maxHealth = 3;
        ship.health = ship.maxHealth;

        /**
         * Gun
         */
        const gun = this.world.attach(id, Gun);
        gun.targetQuery.push(Player);
        gun.fireRate = 1;
        gun.sound.push(SoundTrack.TieBasterLong01);
        gun.color.set(0xff6000);

        return id;
    }

    protected abstract difficulty(): number;
}
