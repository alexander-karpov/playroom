import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Joystick } from './Joystick';
import { Ship } from './Ship';
import { Active, GameObject } from '~/components';
import { Target } from './Target';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();

    // @System.onNot([Player, GameObject, Active])
    // private detachHitable(world: World, id: number) {
    //     const { object3d } = world.getComponent(GameObject, id);

    //     object3d.position.set(0, 0, 0);
    //     object3d.visible = false;

    //     if (world.hasComponent(Active, id)) {
    //         world.deleteComponent(Active, id);
    //     }

    //     setTimeout(() => {
    //         world.addComponent(Active, id);
    //         const airplane =

    //         hitable2.health = 10;
    //         object3d.visible = true;

    //         if (!world.hasComponent(Active, id)) {
    //             world.addComponent(Active, id);
    //         }
    //     }, 1000);
    // }

    @System.on([Joystick])
    private onJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Ship])) {
            const airplane = world.getComponent(Ship, playerId);

            airplane.bootsOn = true;
        }
    }

    @System.onNot([Joystick])
    private onNotJoystick(world: World, id: number) {
        for (const playerId of world.select([Player, Ship])) {
            const airplane = world.getComponent(Ship, playerId);

            airplane.bootsOn = false;

            // Прекращаем поворот если пользователь отпустил джойстик
            airplane.targetDirection.copy(airplane.direction);
        }
    }

    public override onSimulate(world: World, deltaS: number): void {
        for (const joystickId of world.select([Joystick])) {
            const joystick = world.getComponent(Joystick, joystickId);

            if (joystick.tilt === 0) {
                continue;
            }

            this.worldJoystickDirection.set(joystick.direction.x, -joystick.direction.y, 0);

            for (const playerId of world.select([Player, Active, Ship])) {
                const airplane = world.getComponent(Ship, playerId);

                airplane.targetDirection.copy(this.worldJoystickDirection);

                // Курс выбран
                return;
            }
        }

        for (const targetId of world.select([Target, Active, GameObject])) {
            const targetGo = world.getComponent(GameObject, targetId);

            for (const playerId of world.select([Player, Active, Ship])) {
                const { targetDirection } = world.getComponent(Ship, playerId);
                const playerGo = world.getComponent(GameObject, playerId);

                targetDirection
                    .copy(targetGo.object3d.position)
                    .sub(playerGo.object3d.position)
                    .normalize();
            }
        }
    }
}
