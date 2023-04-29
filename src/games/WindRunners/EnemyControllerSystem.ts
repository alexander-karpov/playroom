import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Ship } from './Ship';
import { Enemy } from './Enemy';
import { Active, GameObject } from '~/components';

export class EnemyControllerSystem extends System {
    public override onSimulate(world: World, deltaS: number): void {
        for (const enemyId of world.select([Enemy, Ship, Active])) {
            const enemyGo = world.get(GameObject, enemyId);
            const enemy = world.get(Enemy, enemyId);
            const { targetDirection } = world.get(Ship, enemyId);

            enemy.untilTurnSec += deltaS;

            if (enemy.untilTurnSec > 3) {
                enemy.untilTurnSec = 0;

                for (const playerId of world.select([Player, Ship])) {
                    const playerGo = world.get(GameObject, playerId);

                    targetDirection
                        .copy(playerGo.object3d.position)
                        .sub(enemyGo.object3d.position)
                        .normalize();
                }
            }
        }
    }
}
