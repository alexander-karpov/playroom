import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Ship } from './Ship';
import { Enemy } from './Enemy';
import { Active, GameObject } from '~/components';
import { Hit } from './Hit';
import { type Engine } from 'matter-js';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { Target } from './Target';

export class EnemyControllerSystem extends System {
    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();
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

    public override onUpdate(world: World, deltaS: number): void {
        for (const enemyId of world.select([Enemy, Ship, Active])) {
            const enemyGo = world.get(enemyId, GameObject);
            const enemy = world.get(enemyId, Enemy);
            const { targetDirection } = world.get(enemyId, Ship);

            enemy.untilTurnSec += deltaS;

            if (enemy.untilTurnSec > 3) {
                enemy.untilTurnSec = 0;

                for (const playerId of world.select([Player, Ship])) {
                    const playerGo = world.get(playerId, GameObject);

                    targetDirection
                        .copy(playerGo.object3d.position)
                        .sub(enemyGo.object3d.position)
                        .normalize();
                }
            }
        }
    }
}
