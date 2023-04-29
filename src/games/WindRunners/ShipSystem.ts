import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/components';
import { Ship } from './Ship';
import { Gun } from './Gun';
import { rotationDirection } from '~/utils/dotBetween';
import { Body } from 'matter-js';

export class ShipSystem extends System {
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);
    private readonly movement = new THREE.Vector3(0, 0, 0);

    public override onSimulate(world: World, deltaS: number): void {
        for (const id of world.select([Ship, GameObject, RigibBody, Active])) {
            const { object3d } = world.get(GameObject, id);
            const { body } = world.get(RigibBody, id);
            const { speed, direction, targetDirection, turningSpeed } = world.get(Ship, id);

            const angle = Math.min(direction.angleTo(targetDirection), turningSpeed * deltaS);

            if (angle > 0.001) {
                const rotationSign = Math.sign(
                    rotationDirection(direction, targetDirection, this.screenNormal)
                );

                direction.applyAxisAngle(this.screenNormal, angle * rotationSign);

                object3d.quaternion.setFromUnitVectors(this.screenNormal, direction);

                if (world.has(Gun, id)) {
                    const gun = world.get(Gun, id);
                    gun.direction.copy(direction);
                }
            }

            this.movement.copy(direction).multiplyScalar(speed * deltaS);
            Body.translate(body, this.movement);
        }
    }
}
