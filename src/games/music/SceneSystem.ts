import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Bodies } from 'matter-js';
import * as extraProps from '~/utils/extraProps';
import { RigibBody, GameObject, Touched } from '~/components';

export class SceneSystem extends System {
    private readonly raycaster = new THREE.Raycaster();

    public constructor(
        private readonly renderer: THREE.WebGLRenderer,
        private readonly scene: THREE.Scene,
        private readonly camera: THREE.Camera
    ) {
        super();
    }

    @System.on([GameObject])
    private onGameObject(world: World, entity: number): void {
        const go = world.getComponent(GameObject, entity);

        this.scene.add(go.object);
    }

    public override onCreate(world: World): void {
        window.addEventListener('pointerdown', this.onPointerDown.bind(this, world));
    }

    public override onOutput(world: World, deltaS: number): void {}

    private onPointerDown(world: World, event: MouseEvent): void {
        const pointer = new THREE.Vector2();
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(pointer, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children);
        for (const { object } of intersects) {
            const entity = extraProps.readEntityId(object.userData);

            if (entity == null) {
                continue;
            }

            world.addComponent(Touched, entity);
            world.deleteComponent(Touched, entity);
        }
    }
}
