import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Airplane } from './Airplane';
import { Enemy } from './Enemy';
import { GameObject } from '~/components';

export class EnemyControllerSystem extends System {
    private timeS = 0;

    public override onSimulate(world: World, deltaS: number): void {
        this.timeS += deltaS;

        for (const enemyId of world.select([Enemy, Airplane])) {
            const enemyGo = world.getComponent(GameObject, enemyId);
            const enemyAirplane = world.getComponent(Airplane, enemyId);

            if (this.timeS > 3) {
                for (const playerId of world.select([Player, Airplane])) {
                    const playerGo = world.getComponent(GameObject, playerId);

                    enemyAirplane.direction
                        .copy(playerGo.object3d.position)
                        .sub(enemyGo.object3d.position)
                        .normalize();

                    enemyAirplane.engineOn = Math.random() > 0.5;

                    this.timeS = 0;
                }
            }
        }
    }
}
