import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Bodies, Composite, type Engine } from 'matter-js';
import * as extraProps from '~/utils/extraProps';
import { Touched } from '~/components';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';

export class SceneSystem extends System {
    private readonly raycaster = new THREE.Raycaster();

    public constructor(
        private readonly projectionHelper: ProjectionHelper,
        private readonly scene: THREE.Scene,
        private readonly camera: THREE.Camera,
        private readonly engine: Engine
    ) {
        super();
    }

    public override onCreate(world: World): void {
        this.createWalls();

        window.addEventListener('pointerdown', this.onPointerDown.bind(this, world));
    }

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

    private createWalls(): void {
        const bottomLeft = new THREE.Vector3();
        const topRight = new THREE.Vector3();
        const wallWidth = 300;
        const wallLength = 3000;

        this.projectionHelper.viewToWorld(-1, -1, bottomLeft);
        this.projectionHelper.viewToWorld(1, 1, topRight);

        Composite.add(this.engine.world, [
            Bodies.rectangle(0, topRight.y + wallWidth / 2, wallLength, wallWidth, {
                isStatic: true,
            }),
            Bodies.rectangle(topRight.x + wallWidth / 2, 0, wallWidth, wallLength, {
                isStatic: true,
            }),
            Bodies.rectangle(0, bottomLeft.y - wallWidth / 2, wallLength, wallWidth, {
                isStatic: true,
            }),
            Bodies.rectangle(bottomLeft.x - wallWidth / 2, 0, wallWidth, wallLength, {
                isStatic: true,
            }),
        ]);
    }
}
