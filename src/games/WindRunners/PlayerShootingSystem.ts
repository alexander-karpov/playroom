import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';
import { Player } from './Player';
import { Bullet } from './Bullet';
import { Bits } from '~/utils/Bits';
import { CollisionMasks } from './CollisionMasks';
import { Enemy } from './Enemy';
import { Hitable } from './Hitable';

export class PlayerShootingSystem extends System {
    private untilNextShotSec = 0;
    private readonly delayBetweenShotsSec = 0.3;
    private readonly directionToEnemy = new THREE.Vector3();

    public override onSimulate(world: World, deltaSec: number): void {
        this.untilNextShotSec -= deltaSec;

        if (this.untilNextShotSec > 0) {
            return;
        }

        this.untilNextShotSec = this.delayBetweenShotsSec;

        for (const playerId of world.select([Player, Airplane, GameObject])) {
            const playerAirplane = world.getComponent(Airplane, playerId);
            const playerGo = world.getComponent(GameObject, playerId);

            for (const enemyId of world.select([Enemy, Hitable, GameObject])) {
                const enemyAirplane = world.getComponent(Airplane, enemyId);
                const enemyGo = world.getComponent(GameObject, enemyId);

                this.directionToEnemy
                    .copy(enemyGo.object3d.position)
                    .sub(playerGo.object3d.position)
                    .normalize();

                const angle = playerAirplane.direction.angleTo(this.directionToEnemy);

                if (angle < 0.3) {
                    const [, bullet] = world.addEntity(Bullet);

                    bullet.position.copy(playerGo.object3d.position);
                    // Немного сместим точку выстрела к носу самолёта
                    bullet.position.addScaledVector(playerAirplane.direction, 64);

                    bullet.direction.copy(this.directionToEnemy);
                    bullet.untilDeactivationSec = 1;
                    bullet.speed = 16;
                    bullet.collisionMask = Bits.bit(CollisionMasks.Enemy);
                }
            }
        }
    }
}
