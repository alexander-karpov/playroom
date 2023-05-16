import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './components/Player';
import { Joystick } from './components/Joystick';
import { Ship } from './components/Ship';
import { Active, GameObject } from '~/games/space/components';
import { Target } from './components/Target';
import { type Engine } from 'matter-js';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();

    public constructor() {
        super();
    }

    @System.on([Joystick])
    private onJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Ship])) {
            const airplane = world.get(playerId, Ship);

            airplane.bootsOn = true;
        }
    }

    @System.onNot([Joystick])
    private onNotJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Ship])) {
            const airplane = world.get(playerId, Ship);

            airplane.bootsOn = false;

            // Прекращаем поворот если пользователь отпустил джойстик
            airplane.targetDirection.copy(airplane.direction);
        }
    }

    public override onUpdate(world: World, deltaS: number): void {
        for (const joystickId of world.select([Joystick])) {
            const joystick = world.get(joystickId, Joystick);

            if (joystick.tilt === 0) {
                continue;
            }

            this.worldJoystickDirection.set(joystick.direction.x, -joystick.direction.y, 0);

            for (const playerId of world.select([Player, Active, Ship])) {
                const airplane = world.get(playerId, Ship);

                airplane.targetDirection.copy(this.worldJoystickDirection);
                // airplane.turningSpeed = joystick.tilt * 3.5;

                // Курс выбран
                return;
            }
        }

        for (const targetId of world.select([Target, Active, GameObject])) {
            const targetGo = world.get(targetId, GameObject);

            for (const playerId of world.select([Player, Active, Ship])) {
                const { targetDirection } = world.get(playerId, Ship);
                const playerGo = world.get(playerId, GameObject);

                targetDirection
                    .copy(targetGo.object3d.position)
                    .sub(playerGo.object3d.position)
                    .normalize();
            }
        }
    }
}
