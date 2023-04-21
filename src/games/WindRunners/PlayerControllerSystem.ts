import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Joystick } from './Joystick';
import { Airplane } from './Airplane';
import { rotationDirection } from '~/utils/dotBetween';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);

    @System.on([Joystick])
    private onJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Airplane])) {
            const airplane = world.getComponent(Airplane, playerId);

            airplane.engineOn = true;
        }
    }

    @System.onNot([Joystick])
    private onNotJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Airplane])) {
            const airplane = world.getComponent(Airplane, playerId);

            airplane.engineOn = false;
        }
    }

    public override onSimulate(world: World, deltaS: number): void {
        for (const joystickId of world.select([Joystick])) {
            const joystick = world.getComponent(Joystick, joystickId);

            if (joystick.tilt === 0) {
                continue;
            }

            this.worldJoystickDirection.set(joystick.direction.x, -joystick.direction.y, 0);

            for (const playerId of world.select([Player, Airplane])) {
                const airplane = world.getComponent(Airplane, playerId);

                const rotationDir = rotationDirection(
                    airplane.direction,
                    this.worldJoystickDirection,
                    this.screenNormal
                );

                const angle = Math.min(
                    airplane.direction.angleTo(this.worldJoystickDirection),
                    airplane.turningSpeed * joystick.tilt * deltaS
                );

                airplane.direction.applyAxisAngle(
                    this.screenNormal,
                    angle * Math.sign(rotationDir)
                );
            }
        }
    }
}
