import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/components';
import { Projectile } from './Projectile';
import { Gun } from './Gun';
import { Bodies, Body, Vector, type Engine } from 'matter-js';
import { signedAngleBetween } from '~/utils/signedAngleBetween';
import { Hit } from './Hit';
import { VectorEx } from '~/utils/VectorEx';
import { CollisionCategories } from '../music/CollisionCategories';
import { CollisionCategory } from './CollisionCategory';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { Player } from './Player';

export class ShootingSystem extends System {
    private readonly directionToTarget = Vector.create();
    private readonly rightDirection = new THREE.Vector3(1, 0, 0);
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);
    private readonly minDotForTarget = Math.cos(Math.PI / 8);
    private readonly projectileLifetime = 1;

    public constructor(private readonly scene: THREE.Scene, private readonly engine: Engine) {
        super();
    }

    @System.on([Projectile, Hit])
    private onProjectileHit(world: World, id: number) {
        ObjectPoolHelper.deactivate(world, this.engine, id);
        world.detach(Hit, id);
    }

    public override onSimulate(world: World, deltaSec: number): void {
        for (const gunId of world.select([Gun, GameObject, Active])) {
            const gun = world.get(gunId, Gun);

            gun.untilNextShotSec -= deltaSec;

            if (gun.untilNextShotSec > 0) {
                continue;
            }

            const gunGo = world.get(gunId, GameObject);

            for (const targetId of world.select([...gun.targetQuery, Active])) {
                const { body } = world.get(targetId, RigibBody);

                VectorEx.directionFrom(
                    gunGo.object3d.position,
                    body.position,
                    this.directionToTarget
                );

                const dot = Vector.dot(gun.direction, this.directionToTarget);

                if (dot >= this.minDotForTarget) {
                    this.fireProjectile(world, gunGo, gun, body.collisionFilter.category);
                    break;
                }
            }
        }

        for (const id of world.select([Projectile])) {
            const projectile = world.get(id, Projectile);

            projectile.untilSelfDestructionSec -= deltaSec;

            if (projectile.untilSelfDestructionSec <= 0) {
                ObjectPoolHelper.deactivate(world, this.engine, id);
            }
        }
    }

    private fireProjectile(
        world: World,
        gunGo: GameObject,
        gun: Gun,
        targetCollisionCategory: number | undefined
    ) {
        gun.untilNextShotSec = 1 / gun.fireRate;

        const id = this.findUnusedOrCreateProjectile(world);

        const projectile = world.get(id, Projectile);
        projectile.untilSelfDestructionSec = this.projectileLifetime;

        ObjectPoolHelper.activate(world, this.engine, id);
        this.reconfigure(world, id, gun, gunGo, targetCollisionCategory);
    }

    private reconfigure(
        world: World,
        id: number,
        gun: Gun,
        gunGo: GameObject,
        targetCollisionCategory: number | undefined
    ) {
        const { body } = world.get(id, RigibBody);

        body.collisionFilter.mask = targetCollisionCategory;
        Body.setVelocity(body, gun.direction.clone().multiplyScalar(32));

        Body.setPosition(
            body,
            // TODO: Убрать клонирование
            gunGo.object3d.position.clone().add(gun.direction.clone().multiplyScalar(64))
        );

        Body.setAngle(
            body,
            -signedAngleBetween(gun.direction, this.rightDirection, this.screenNormal)
        );
    }

    private findUnusedOrCreateProjectile(world: World): number {
        for (const id of world.selectExcept([Projectile], [Active])) {
            return id;
        }

        return this.createProjectile(world);
    }

    private createProjectile(world: World): number {
        const [id] = world.newEntity(Projectile);
        const go = world.attach(id, GameObject);

        go.object3d = new THREE.Mesh(
            // TODO: переиспользовать геометрию и материал
            new THREE.PlaneGeometry(64, 4),
            new THREE.MeshBasicMaterial({
                color: 0x60ff00,
                transparent: false,
                depthTest: false,
                depthWrite: false,
            })
        );

        this.scene.add(go.object3d);

        const rb = world.attach(id, RigibBody);
        rb.body = Bodies.rectangle(0, 0, 64, 4, {
            isSensor: true,
            collisionFilter: {
                category: CollisionCategory.Projectile,
            },
        });

        return id;
    }
}
