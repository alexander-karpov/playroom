import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/games/space/components';
import { Ship } from '../components/Ship';
import { Gun } from '../components/Gun';
import { rotationDirection } from '~/utils/dotBetween';
import { Body } from 'matter-js';

export class ShipSystem extends System {
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);
    private readonly movement = new THREE.Vector3(0, 0, 0);

    @System.on([GameObject, Ship])
    private onGameObjectShip(world: World, id: number) {
        const { object3d } = world.get(id, GameObject);
        const { direction } = world.get(id, Ship);

        object3d.quaternion.setFromUnitVectors(this.screenNormal, direction);
    }

    public override onUpdate(world: World, deltaS: number): void {
        for (const id of world.select([Ship, GameObject, RigibBody, Active])) {
            const { object3d } = world.get(id, GameObject);
            const { body } = world.get(id, RigibBody);
            const { speed, direction, targetDirection, turningSpeed } = world.get(id, Ship);

            const angle = Math.min(direction.angleTo(targetDirection), turningSpeed * deltaS);

            if (angle > 0.001) {
                const rotationSign = Math.sign(
                    rotationDirection(direction, targetDirection, this.screenNormal)
                );

                direction.applyAxisAngle(this.screenNormal, angle * rotationSign);

                object3d.quaternion.setFromUnitVectors(this.screenNormal, direction);

                if (world.has(Gun, id)) {
                    const gun = world.get(id, Gun);
                    gun.direction.copy(direction);
                }
            }

            this.movement.copy(direction).multiplyScalar(speed * deltaS);
            Body.translate(body, this.movement);
        }
    }
}
