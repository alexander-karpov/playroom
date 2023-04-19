import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Player } from './Player';
import { GameObject, RigibBody } from '~/components';

export class Following2DCameraSystem extends System {
    private readonly targetPositionProjection = new THREE.Vector3();

    public constructor(private readonly camera: THREE.Camera) {
        super();
    }

    public override onOutput(world: World, deltaS: number): void {
        for (const id of world.select([Player, GameObject])) {
            const go = world.getComponent(GameObject, id);

            this.targetPositionProjection.set(
                go.object3d.position.x,
                go.object3d.position.y,
                this.camera.position.z
            );

            this.camera.position.lerp(this.targetPositionProjection, deltaS * 2);
        }
    }
}
