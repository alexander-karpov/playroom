import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Bodies, Composite, type Engine } from 'matter-js';
import * as extraProps from '~/utils/extraProps';
import { Touched } from '~/components';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Bits } from '~/utils/Bits';
import { CollisionCategories } from './CollisionCategories';
import { isOrthographicCamera } from '~/utils/typeGuards';
import { animate, easeIn, easeOut } from 'popmotion';
import { Star } from './Star';

export class SceneSystem extends System {
    private readonly raycaster = new THREE.Raycaster();
    private stopZoom?: () => void;

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
        window.addEventListener('pointerup', this.onPointerUp.bind(this, world));
    }

    private onPointerDown(world: World, event: MouseEvent): void {
        const pointer = new THREE.Vector2();
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(pointer, this.camera);

        // TODO: Добавить маску для проверки колизий чтобы не проверять мусор по мусору
        const intersects = this.raycaster.intersectObjects(this.scene.children);
        for (const { object } of intersects) {
            const entity = extraProps.readEntityId(object.userData);

            if (entity != null && world.hasComponent(Star, entity)) {
                // Добавить компонент отвечающий за приём рейтрейса объект
                world.addComponent(Touched, entity);
                world.deleteComponent(Touched, entity);

                return;
            }
        }

        this.zoom(1 / 2);
    }

    private onPointerUp(world: World, event: MouseEvent): void {
        this.zoom(1);
    }

    private createWalls(): void {
        const bottomLeft = new THREE.Vector3();
        const topRight = new THREE.Vector3();
        const wallWidth = 300;
        const wallLength = 3000;

        this.projectionHelper.viewToWorld(-1, -1, bottomLeft);
        this.projectionHelper.viewToWorld(1, 1, topRight);

        const collisionFilter = {
            category: Bits.bit(CollisionCategories.Wall),
            mask: Bits.bit(CollisionCategories.Star),
        };

        Composite.add(this.engine.world, [
            Bodies.rectangle(0, topRight.y + wallWidth / 2, wallLength, wallWidth, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(topRight.x + wallWidth / 2, 0, wallWidth, wallLength, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(0, bottomLeft.y - wallWidth / 2, wallLength, wallWidth, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(bottomLeft.x - wallWidth / 2, 0, wallWidth, wallLength, {
                isStatic: true,
                collisionFilter,
            }),
        ]);
    }

    private zoom(to: number) {
        const camera = this.camera;

        if (!isOrthographicCamera(camera)) {
            return;
        }

        if (camera.zoom === to) {
            return;
        }

        this.stopZoom?.();

        this.stopZoom = animate({
            from: camera.zoom,
            to: to,
            onUpdate: (v) => {
                camera.zoom = v;
                camera.updateProjectionMatrix();
            },
            ease: [easeOut],
        }).stop;
    }
}
