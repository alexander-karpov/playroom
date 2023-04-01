import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Bodies } from 'matter-js';
import * as extraProps from '~/utils/extraProps';
import { RigibBody, GameObject, Touched } from '~/components';

export class SceneSystem extends System {
    private readonly raycaster = new THREE.Raycaster();
    private readonly renderer: THREE.WebGLRenderer;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;

    public constructor() {
        super();

        /**
         * Renderer
         */
        this.renderer = new THREE.WebGLRenderer();

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        /**
         * Scene
         */
        this.scene = new THREE.Scene();

        /**
         * Camera
         */
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.z = 50;

        // MatterJs плохо работает с очень маленькими цифрами
        // по-этому делаем все объекты больших размеров
        this.camera.scale.z = 0.05;
    }

    @System.on([GameObject])
    private onGameObject(world: World, entity: number): void {
        const go = world.getComponent(GameObject, entity);

        this.scene.add(go.object);
    }

    public override onCreate(world: World): void {
        this.createWalls(world);

        window.addEventListener('pointerdown', this.onPointerDown.bind(this, world));
    }

    public override onOutput(world: World, deltaS: number): void {
        this.renderer.render(this.scene, this.camera);
    }

    private createWalls(world: World): void {
        const [, bottom] = world.addEntity(RigibBody);
        bottom.body = Bodies.rectangle(0, -600, 3000, 300, { isStatic: true });

        const [, top] = world.addEntity(RigibBody);
        top.body = Bodies.rectangle(0, 600, 3000, 300, { isStatic: true });
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
}
