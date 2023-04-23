import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';
import { Gun } from './Gun';

export class AirplaneSystem extends System {
    private readonly originalAirplaneModelDirection = new THREE.Vector3(0, 0, 1);

    public override onSimulate(world: World, deltaS: number): void {
        for (const id of world.select([Airplane, GameObject])) {
            const { object3d } = world.getComponent(GameObject, id);
            const { speed, direction } = world.getComponent(Airplane, id);

            object3d.quaternion.setFromUnitVectors(this.originalAirplaneModelDirection, direction);

            object3d.position.addScaledVector(direction, speed * deltaS);

            if (world.hasComponent(Gun, id)) {
                const gun = world.getComponent(Gun, id);
                gun.direction.copy(direction);
            }
        }
    }
}
