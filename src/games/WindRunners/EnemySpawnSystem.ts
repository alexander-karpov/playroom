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
    private onProjectileHit(world: World, id: number) {
        world.deleteComponent(Hit, id);

        const ship = this.world.getComponent(Ship, id);

        ship.health -= 1;

        if (ship.health <= 0) {
            ObjectPoolHelper.deactivate(world, this.engine, id);

            if (world.hasComponent(Target, id)) {
                world.deleteComponent(Target, id);
            }
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
        const { body } = this.world.getComponent(RigibBody, id);

        const ship = this.world.getComponent(Ship, id);

        ship.health = 5;

        for (const playerId of this.world.select([Player, Active])) {
            const { body: playerBody } = this.world.getComponent(RigibBody, playerId);

            Body.setPosition(body, playerBody.position);
        }
    }

    private createEnemy(originalModel: THREE.Object3D): number {
        /**
         * Enemy
         */
        const [id, enemy] = this.world.addEntity(Enemy);
        enemy.untilTurnSec = 0.5 + Math.random() * 2;

        /**
         * GameObject
         */
        const go = this.world.addComponent(GameObject, id);
        go.object3d = SkeletonUtils.clone(originalModel);
        go.object3d.scale.multiplyScalar(0.2);
        go.object3d.position.set(200 * Math.random(), 200 * Math.random(), 0);
        this.scene.add(go.object3d);

        /**
         * RigibBody
         */
        const rb = this.world.addComponent(RigibBody, id);
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

        /**
         * Ship
         */
        const ship = this.world.addComponent(Ship, id);
        ship.turningSpeed = 3;

        /**
         * Gun
         */
        const gun = this.world.addComponent(Gun, id);
        gun.targetQuery.push(Player);
        gun.fireRate = 1;

        return id;
    }

    private distanceFromStart(): number {
        for (const id of this.world.select([Player, RigibBody])) {
            const { body } = this.world.getComponent(RigibBody, id);

            return Vector.magnitude(body.position);
        }

        return 0;
    }

    private difficulty(): number {
        return Math.floor(this.distanceFromStart() / 1000);
    }
}
