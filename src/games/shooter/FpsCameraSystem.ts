import type * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';

export class FpsCameraSystem extends System {
    public constructor(
        private readonly world: World,
        private readonly camera: THREE.Camera,
        private readonly renderer: THREE.WebGLRenderer
    ) {
        super();

        const container = renderer.domElement;

        container.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
        });

        document.body.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                camera.rotation.y -= event.movementX / 500;
                camera.rotation.x -= event.movementY / 500;
            }
        });
    }
}
