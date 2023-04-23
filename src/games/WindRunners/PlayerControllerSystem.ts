import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Joystick } from './Joystick';
import { Airplane } from './Airplane';
import { rotationDirection } from '~/utils/dotBetween';
import { GameObject } from '~/components';
import { Hitable } from './Hitable';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);

    @System.onNot([Player, GameObject, Hitable])
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
