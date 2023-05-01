import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Joystick } from './Joystick';
import { Ship } from './Ship';
import { Active, GameObject, RigibBody } from '~/components';
import { Target } from './Target';
import { Hit } from './Hit';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { Body, type Engine } from 'matter-js';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();

    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();
    }

    @System.on([Player, Hit])
    private onPlayerHit(world: World, id: number) {
        world.detach(Hit, id);
        const ship = world.get(id, Ship);
        const { body } = world.get(id, RigibBody);

        ship.health -= 1;

        if (ship.health <= 0) {
            if (world.has(Active, id)) {
                world.detach(Active, id);
                Body.setPosition(body, { x: 0, y: 0 });
                ObjectPoolHelper.deactivate(world, this.engine, id);
            }

            setTimeout(() => {
                ObjectPoolHelper.activate(world, this.engine, id);
                ship.health = ship.maxHealth;
            }, 1000);
        }
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

    public override onSimulate(world: World, deltaS: number): void {
        for (const joystickId of world.select([Joystick])) {
            const joystick = world.get(joystickId, Joystick);

            if (joystick.tilt === 0) {
                continue;
            }

            this.worldJoystickDirection.set(joystick.direction.x, -joystick.direction.y, 0);

            for (const playerId of world.select([Player, Active, Ship])) {
                const airplane = world.get(playerId, Ship);

                airplane.targetDirection.copy(this.worldJoystickDirection);

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
