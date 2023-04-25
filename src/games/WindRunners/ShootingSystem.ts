import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';
import { Gun } from './Gun';
import type { Vector3 } from 'three';

export class ShootingSystem extends System {
    private readonly directionToTarget = new THREE.Vector3();
    private readonly rightDirection = new THREE.Vector3(1, 0, 0);

    public constructor(private readonly scene: THREE.Scene) {
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
                    this.createBullet(world, gunGo, gun);
                    gun.untilNextShotSec = 1 / gun.fireRateInSec;
                    break;
                }
            }
        }
    }

    private createBullet(world: World, gunGo: GameObject, gun: Gun) {
        const [id, bullet, go] = this.findUnusedOrCreateNewBullet(world);

        bullet.position.copy(gunGo.object3d.position);
        bullet.position.addScaledVector(gun.direction, 64);
        bullet.direction.copy(gun.direction);
        bullet.untilDeactivationSec = 1;
        bullet.targetMask = gun.targetMask;

        go.object3d.quaternion.setFromUnitVectors(this.rightDirection, bullet.direction);
        go.object3d.visible = true;
    }

    private findUnusedOrCreateNewBullet(world: World): [number, Bullet, GameObject] {
        for (const id of world.select([Bullet])) {
            const bullet = world.getComponent(Bullet, id);

            if (bullet.untilDeactivationSec <= 0) {
                const go = world.getComponent(GameObject, id);

                return [id, bullet, go];
            }
        }

        return this.createNewBullet(world);
    }

    private createNewBullet(world: World): [number, Bullet, GameObject] {
        const [id, bullet] = world.addEntity(Bullet);

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

        return [id, bullet, go];
    }

    private activateBullet(world: World, id: number) {
        const bullet = world.getComponent(Bullet, id);

        if (world.hasComponent(GameObject, id)) {
            const go = world.getComponent(GameObject, id);

            go.object3d.visible = true;
            go.object3d.position.copy(bullet.position);
        }
    }
}
