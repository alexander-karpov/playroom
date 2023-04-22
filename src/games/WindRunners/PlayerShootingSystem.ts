import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';
import { Player } from './Player';
import { Bullet } from './Bullet';
import { Bits } from '~/utils/Bits';
import { CollisionMasks } from './CollisionMasks';

export class PlayerShootingSystem extends System {
    private untilNextShotSec = 0;
    private readonly delayBetweenShotsSec = 0.3;

    public override onSimulate(world: World, deltaSec: number): void {
        this.untilNextShotSec -= deltaSec;

        if (this.untilNextShotSec > 0) {
            return;
        }

        this.untilNextShotSec = this.delayBetweenShotsSec;

        for (const id of world.select([Player, Airplane, GameObject])) {
            const { speed, direction, engineOn } = world.getComponent(Airplane, id);
            const { object3d } = world.getComponent(GameObject, id);

            const [, bullet] = world.addEntity(Bullet);

            bullet.position.copy(object3d.position);
            // Немного сместим точку выстрела к носу самолёта
            bullet.position.addScaledVector(direction, 100);

            bullet.direction.copy(direction);
            bullet.untilDeactivationSec = 1;
            bullet.speed = 16;
            bullet.collisionMask = Bits.bit(CollisionMasks.Enemy);
        }
    }
}
