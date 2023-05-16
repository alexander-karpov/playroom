import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Active, GameObject, RigibBody, Sound } from '~/games/space/components';
import { Projectile } from './components/Projectile';
import { Gun } from './components/Gun';
import { Bodies, Body, Vector, type Engine } from 'matter-js';
import { signedAngleBetween } from '~/utils/signedAngleBetween';
import { Hit } from './components/Hit';
import { VectorEx } from '~/utils/VectorEx';
import { CollisionCategory } from './CollisionCategory';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { fib } from '~/utils/fib';
import { SoundTrack } from '~/systems/AudioSystem';
import { choose } from '~/utils/choose';

export class ShootingSystem extends System {
    private readonly directionToTarget = Vector.create();
    private readonly rightDirection = new THREE.Vector3(1, 0, 0);
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);
    private readonly minDotForTarget = Math.cos(Math.PI / 8);
    private readonly projectileLifetime = 1;
    private readonly laserGeom = new THREE.PlaneGeometry(fib(12), 4);

    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();
    }

    @System.on([Projectile, Hit])
    private onProjectileHit(world: World, id: number) {
        ObjectPoolHelper.deactivate(world, this.engine, id);
        world.detach(id, Hit);
    }

    public override onUpdate(world: World, deltaSec: number): void {
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

        for (const id of world.select([Projectile, Active])) {
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
        // TODO: Убрать клонирование
        Body.setVelocity(body, gun.direction.clone().multiplyScalar(64));

        Body.setPosition(
            body,
            // TODO: Убрать клонирование
            gunGo.object3d.position.clone().add(gun.direction.clone().multiplyScalar(64))
        );

        Body.setAngle(
            body,
            -signedAngleBetween(gun.direction, this.rightDirection, this.screenNormal)
        );

        const sound = this.world.attach(id, Sound);
        sound.track = choose(gun.sound);

        const { object3d } = world.get(id, GameObject);
        ((object3d as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(gun.color);
        object3d.scale.set(gun.projectileSize, 1, 1);
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
            this.laserGeom,
            new THREE.MeshBasicMaterial({
                color: 0x60ff00,
                transparent: false,
                depthTest: false,
                depthWrite: false,
            })
        );

        this.scene.add(go.object3d);

        const rb = world.attach(id, RigibBody);
        rb.body = Bodies.rectangle(0, 0, fib(12), 4, {
            isSensor: true,
            collisionFilter: {
                category: CollisionCategory.Projectile,
            },
            friction: 0,
            frictionAir: 0,
        });

        return id;
    }
}
