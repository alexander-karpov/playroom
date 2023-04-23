import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Bullet } from './Bullet';
import { Bits } from '~/utils/Bits';
import { Hitable } from './Hitable';
import { Gun } from './Gun';
import type { Vector3 } from 'three';

export class ShootingSystem extends System {
    private readonly directionToTarget = new THREE.Vector3();

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
                    this.createBullet(world, gunGo, gun, this.directionToTarget);
                    gun.untilNextShotSec = gun.delayBetweenShotsSec;
                    break;
                }
            }
        }
    }

    private createBullet(world: World, gunGo: GameObject, gun: Gun, directionToTarget: Vector3) {
        const [, bullet] = world.addEntity(Bullet);

        bullet.position.copy(gunGo.object3d.position);

        // Немного сместим точку выстрела к носу самолёта
        bullet.position.addScaledVector(gun.direction, 64);

        bullet.direction.copy(directionToTarget);
        bullet.untilDeactivationSec = 1;
        bullet.targetMask = gun.targetMask;
    }
}
