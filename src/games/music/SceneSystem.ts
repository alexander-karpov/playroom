import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Bodies, Body, Composite, Vector, type Engine } from 'matter-js';
import * as extraProps from '~/utils/extraProps';
import { Touched } from '~/components';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Bits } from '~/utils/Bits';
import { CollisionCategories } from './CollisionCategories';
import { isOrthographicCamera } from '~/utils/typeGuards';
import { animate, easeOut } from 'popmotion';
import { Star } from './Star';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { type EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import type GUI from 'lil-gui';
import { nameof } from '~/utils/nameof';

export class SceneSystem extends System {
    private readonly raycaster = new THREE.Raycaster();
    private readonly bloomPass: UnrealBloomPass;
    private readonly camera: THREE.OrthographicCamera;
    private stopZoom?: () => void;

    public constructor(
        private readonly projectionHelper: ProjectionHelper,
        private readonly scene: THREE.Scene,
        camera: THREE.Camera,
        private readonly renderer: THREE.WebGLRenderer,
        private readonly composer: EffectComposer,
        private readonly engine: Engine,
        private readonly lil: GUI
    ) {
        super();

        this.camera = camera as THREE.OrthographicCamera;

        // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // THREE.LinearSRGBColorSpace;
        // this.renderer.toneMappingExposure = 1;

        /**
         * Bloom
         */
        // @see https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_unreal_bloom.html
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
            0.5,
            0,
            0.4
        );

        this.bloomPass.enabled = false;
        this.bloomPass.strength = 0;
        this.composer.addPass(this.bloomPass);

        /**
         * Background
         */
        this.scene.background = new THREE.Color().setHSL(0.63, 0.3, 0.14);

        /**
         * Lil
         */
        this.setupLil(this.bloomPass);
    }

    public override onOutput(world: World, deltaS: number): void {
        if (this.camera.zoom !== 1) {
            this.bloomPass.enabled = true;
            this.bloomPass.strength = (1 - this.camera.zoom) * 2;
        } else {
            this.bloomPass.enabled = false;
        }

        this.composer.render();
    }

    public override onCreate(world: World): void {
        this.createWalls();

        this.renderer.domElement.addEventListener(
            'pointerdown',
            this.onPointerDown.bind(this, world)
        );

        this.renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this, world));
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

            if (entity != null && world.has(Star, entity)) {
                // Добавить компонент отвечающий за приём рейтрейса объект
                world.attach(Touched, entity);
                world.detach(Touched, entity);

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
        const wallWidth = 1000;
        const wallLength = 6000;

        const collisionFilter = {
            category: Bits.bit(CollisionCategories.Wall),
            mask: Bits.bit(CollisionCategories.Star),
        };

        const walls = [
            Bodies.rectangle(0, 0, wallLength, wallWidth, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(0, 0, wallWidth, wallLength, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(0, 0, wallLength, wallWidth, {
                isStatic: true,
                collisionFilter,
            }),
            Bodies.rectangle(0, 0, wallWidth, wallLength, {
                isStatic: true,
                collisionFilter,
            }),
        ];

        const setWallsPositions = () => {
            this.projectionHelper.viewToWorld(-1, -1, bottomLeft);
            this.projectionHelper.viewToWorld(1, 1, topRight);

            const positions = [
                [0, topRight.y + wallWidth / 2],
                [topRight.x + wallWidth / 2, 0],
                [0, bottomLeft.y - wallWidth / 2],
                [bottomLeft.x - wallWidth / 2, 0],
            ];

            const pos = Vector.create(0, 0);

            for (let i = 0; i < 4; i++) {
                pos.x = positions[i]![0]!;
                pos.y = positions[i]![1]!;
                Body.setPosition(walls[i]!, pos);
            }
        };

        setWallsPositions();

        window.addEventListener('resize', setWallsPositions);

        Composite.add(this.engine.world, walls);
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

    private setupLil(bloomPass: UnrealBloomPass) {
        /**
         * Background
         */

        const sceneConfig = {
            background: (this.scene.background as THREE.Color).getHex(),
        };

        this.lil
            .addColor(sceneConfig, nameof<THREE.Scene>('background'))
            .name('Цвет фона')
            .onChange((backgroundHex: number) =>
                (this.scene.background as THREE.Color).setHex(backgroundHex)
            );

        const bloomConfig = this.lil.addFolder('Свечение');

        /**
         * UnrealBloomPass
         */
        bloomConfig
            .add(bloomPass, nameof<UnrealBloomPass>('enabled'), 0, 2)
            .name('Свечение')
            .onChange((enabled: boolean) => (bloomPass.enabled = enabled));

        bloomConfig
            .add(bloomPass, nameof<UnrealBloomPass>('strength'), 0, 2)
            .name('Сила свечения')
            .onChange((strength: number) => (bloomPass.strength = strength));

        bloomConfig
            .add(bloomPass, nameof<UnrealBloomPass>('radius'), 0, 3)
            .name('Радиус свечения')
            .onChange((radius: number) => (bloomPass.radius = radius));

        bloomConfig
            .add(bloomPass, nameof<UnrealBloomPass>('threshold'), 0, 1)
            .name('Порог свечения')
            .onChange((threshold: number) => (bloomPass.threshold = threshold));
    }
}
