import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Ship } from './Ship';
import { Gun } from './Gun';
import { rotationDirection } from '~/utils/dotBetween';

export class AirplaneSystem extends System {
    private readonly screenNormal = new THREE.Vector3(0, 0, 1);

    public override onSimulate(world: World, deltaS: number): void {
        for (const id of world.select([Ship, GameObject])) {
            const { object3d } = world.getComponent(GameObject, id);
            const { speed, direction, targetDirection, turningSpeed } = world.getComponent(
                Ship,
                id
            );

            const angle = Math.min(direction.angleTo(targetDirection), turningSpeed * deltaS);

            if (angle > 0.001) {
                const rotationSign = Math.sign(
                    rotationDirection(direction, targetDirection, this.screenNormal)
                );

                direction.applyAxisAngle(this.screenNormal, angle * rotationSign);

                object3d.quaternion.setFromUnitVectors(this.screenNormal, direction);

                if (world.hasComponent(Gun, id)) {
                    const gun = world.getComponent(Gun, id);
                    gun.direction.copy(direction);
                }
            }

            object3d.position.addScaledVector(direction, speed * deltaS);
        }
    }
}
