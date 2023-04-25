import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/components';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';
import { Gun } from './Gun';
import { Bodies, Body, Composite, type Engine } from 'matter-js';
import { signedAngleBetween } from '~/utils/signedAngleBetween';

export class ShootingSystem extends System {
    private readonly directionToTarget = new THREE.Vector3();
    private readonly rightDirection = new THREE.Vector3(1, 0, 0);
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);

    public constructor(private readonly scene: THREE.Scene, private readonly engine: Engine) {
        super();
    }

    public override onSimulate(world: World, deltaSec: number): void {
        for (const gunId of world.select([Gun, GameObject])) {
            const gun = world.getComponent(Gun, gunId);

            gun.untilNextShotSec -= deltaSec;

            if (gun.untilNextShotSec > 0) {
                continue;
            }

            const gunGo = world.getComponent(GameObject, gunId);

            for (const hitableId of world.select([Hitable, GameObject])) {
                const hitable = world.getComponent(Hitable, hitableId);

                if (hitable.mask !== gun.targetMask) {
                    continue;
                }

                const hitableGo = world.getComponent(GameObject, hitableId);

                this.directionToTarget
                    .copy(hitableGo.object3d.position)
                    .sub(gunGo.object3d.position)
                    .normalize();

                const angle = gun.direction.angleTo(this.directionToTarget);

                if (angle <= gun.angle) {
                    this.fireProjectile(world, gunGo, gun);
                    gun.untilNextShotSec = 1 / gun.fireRateInSec;
                    break;
                }
            }
        }
    }

    private fireProjectile(world: World, gunGo: GameObject, gun: Gun) {
        const id = this.findUnusedOrCreateBullet(world);

        const projectile = world.getComponent(Bullet, id);
        const { object3d } = world.getComponent(GameObject, id);
        const { body } = world.getComponent(RigibBody, id);

        projectile.untilDeactivationSec = 1;
        object3d.visible = true;
        Body.setVelocity(body, gun.direction.clone().multiplyScalar(32));
        Body.setPosition(
            body,
            gunGo.object3d.position.clone().add(gun.direction.clone().multiplyScalar(64))
        );
        Body.setAngle(
            body,
            -signedAngleBetween(gun.direction, this.rightDirection, this.screenNormal)
        );
        Composite.add(this.engine.world, body);
    }

    private findUnusedOrCreateBullet(world: World): number {
        for (const id of world.selectExcept([Bullet], [Active])) {
            return id;
        }

        return this.createBullet(world);
    }

    private createBullet(world: World): number {
        const [id] = world.addEntity(Bullet);
        world.addComponent(Active, id);

        const go = world.addComponent(GameObject, id);

        go.object3d = new THREE.Mesh(
            new THREE.PlaneGeometry(64, 4),
            new THREE.MeshBasicMaterial({
                color: 0x60ff00,
                transparent: false,
                depthTest: false,
                depthWrite: false,
            })
        );

        this.scene.add(go.object3d);

        const rb = world.addComponent(RigibBody, id);
        rb.body = Bodies.rectangle(0, 0, 64, 4);

        return id;
    }
}
