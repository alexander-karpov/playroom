import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Jet } from './Jet';

export class JetSystem extends System {
    private readonly tempQuat = new THREE.Quaternion();

    public override onSimulate(world: World, deltaS: number): void {
        for (const id of world.select([Jet, GameObject])) {
            const { object3d } = world.getComponent(GameObject, id);
            const { speed, direction } = world.getComponent(Jet, id);

            this.tempQuat.setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                new THREE.Vector3(direction.x, direction.y, 0)
            );

            object3d.position.add(
                new THREE.Vector3(direction.x, direction.y, 0).multiplyScalar(speed * deltaS)
            );

            object3d.quaternion.rotateTowards(this.tempQuat, speed * deltaS);
        }
    }
}
