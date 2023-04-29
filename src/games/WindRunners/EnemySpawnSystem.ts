import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Active, GameObject, RigibBody } from '~/components';
import { Composite, Vector, type Engine, Body } from 'matter-js';
import { Enemy } from './Enemy';
import type * as THREE from 'three';
import { loadGLTF } from '~/utils/loadGLTF';
import { Ship } from './Ship';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { createBodyForObject3d } from '~/utils/createBodyForObject3d';
import { CollisionCategory } from './CollisionCategory';
import { Gun } from './Gun';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { VectorEx } from '~/utils/VectorEx';
import { Hit } from './Hit';
import { Target } from './Target';

/**
 * Спавним врагов:
 *  - чем дальше от стартовой точки тем больше их количество
 */
export class EnemySpawnSystem extends System {
    private model?: THREE.Object3D;

    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();

        void loadGLTF('Spaceship4.glb').then((gltf) => {
            this.model = gltf.scene.children[0];
        });
    }

    @System.on([Enemy, Hit])
    private onEnemyHit(world: World, id: number) {
        world.detach(Hit, id);

        const ship = this.world.get(id, Ship);

        ship.health -= 1;

        if (ship.health <= 0) {
            ObjectPoolHelper.deactivate(world, this.engine, id);

            if (world.has(Target, id)) {
                world.detach(Target, id);
            }
        }
    }

    @System.on([Player, Active])
    private onNotPlayerActive(world: World, id: number) {
        for (const id of this.world.select([Enemy])) {
            ObjectPoolHelper.deactivate(world, this.engine, id);
        }
    }

    public override onSometimes(world: World): void {
        const expectedEnemies = this.difficulty();
        const activeEnemies = this.world.count([Enemy, Active]);
        const missing = expectedEnemies - activeEnemies;

        for (let i = 0; i < missing; i++) {
            this.spawnEnemy();
        }
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

    private reconfigure(id: number) {
        const { body } = this.world.get(id, RigibBody);

        const ship = this.world.get(id, Ship);

        ship.health = 5;

        for (const playerId of this.world.select([Player, Active])) {
            const { body: playerBody } = this.world.get(playerId, RigibBody);

            Body.setPosition(body, playerBody.position);
        }
    }

    private createEnemy(originalModel: THREE.Object3D): number {
        /**
         * Enemy
         */
        const [id, enemy] = this.world.newEntity(Enemy);
        enemy.untilTurnSec = 0.5 + Math.random() * 2;

        /**
         * GameObject
         */
        const go = this.world.attach(id, GameObject);
        go.object3d = SkeletonUtils.clone(originalModel);
        go.object3d.scale.multiplyScalar(0.2);
        go.object3d.position.set(200 * Math.random(), 200 * Math.random(), 0);
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
        ship.turningSpeed = 3;

        /**
         * Gun
         */
        const gun = this.world.attach(id, Gun);
        gun.targetQuery.push(Player);
        gun.fireRate = 1;

        return id;
    }

    private distanceFromStart(): number {
        for (const id of this.world.select([Player, RigibBody])) {
            const { body } = this.world.get(id, RigibBody);

            return Vector.magnitude(body.position);
        }

        return 0;
    }

    private difficulty(): number {
        return Math.floor(this.distanceFromStart() / 1000);
    }
}
