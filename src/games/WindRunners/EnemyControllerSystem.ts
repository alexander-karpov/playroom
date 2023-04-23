import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Airplane } from './Airplane';
import { Enemy } from './Enemy';
import { GameObject } from '~/components';
import { Hitable } from './Hitable';

export class EnemyControllerSystem extends System {
    @System.onNot([Enemy, GameObject, Hitable])
    private detachHitable(world: World, id: number) {
        const hitable = world.getComponent(Hitable, id);
        const { object3d } = world.getComponent(GameObject, id);

        object3d.position.set(0, 0, 0);
        object3d.visible = false;

        setTimeout(() => {
            const hitable2 = world.addComponent(Hitable, id);

            Hitable.copy(hitable, hitable2);

            hitable2.health = 1;
            object3d.visible = true;
        }, 1000);
    }

    public override onSimulate(world: World, deltaS: number): void {
        for (const enemyId of world.select([Enemy, Airplane])) {
            const enemyGo = world.getComponent(GameObject, enemyId);
            const enemy = world.getComponent(Enemy, enemyId);
            const enemyAirplane = world.getComponent(Airplane, enemyId);

            enemy.untilTurnSec += deltaS;

            if (enemy.untilTurnSec > 3) {
                enemy.untilTurnSec = 0;

                for (const playerId of world.select([Player, Airplane])) {
                    const playerGo = world.getComponent(GameObject, playerId);

                    enemyAirplane.direction
                        .copy(playerGo.object3d.position)
                        .sub(enemyGo.object3d.position)
                        .normalize();

                    enemyAirplane.engineOn = Math.random() > 0.5;
                }
            }
        }
    }
}
