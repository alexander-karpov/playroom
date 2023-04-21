import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';

export class AirplaneSystem extends System {
    private readonly originalAirplaneModelDirection = new THREE.Vector3(0, 0, 1);

    public override onSimulate(world: World, deltaS: number): void {
        for (const id of world.select([Airplane, GameObject])) {
            const { object3d } = world.getComponent(GameObject, id);
            const { speed, direction, engineOn } = world.getComponent(Airplane, id);

            object3d.quaternion.setFromUnitVectors(this.originalAirplaneModelDirection, direction);

            object3d.position.addScaledVector(direction, (engineOn ? speed : speed * 0.5) * deltaS);
        }
    }
}
