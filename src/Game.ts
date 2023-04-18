import type { Runtime } from '~/ecs';
import { changeMatterJsRandomSeed } from '~/utils/changeMatterJsRandomSeed';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Engine } from 'matter-js';
import GUI from 'lil-gui';
import { initYandexSdk } from '~/yandexSdk';
import { ScreenSizeSource } from './ScreenSizeSource';

export abstract class Game {
    protected readonly screenSizeSource = new ScreenSizeSource();

    public run() {
        changeMatterJsRandomSeed();

        const yandexSdk = initYandexSdk();

        /**
         * Renderer
         */
        const { renderer, composer } = this.configureRenderer();

        /**
         * Scene
         */
        const scene = new THREE.Scene();

        /**
         * Camera
         */
        const camera = new THREE.OrthographicCamera();
        camera.near = 1;
        camera.far = 10000;
        camera.position.z = 1000;

        /**
         * Resize
         */
        function onResizeCamera() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            renderer.setSize(width, height, false);

            camera.left = width / -2;
            camera.right = width / 2;
            camera.top = height / 2;
            camera.bottom = height / -2;
            camera.updateProjectionMatrix();
        }

        onResizeCamera();

        window.addEventListener('resize', onResizeCamera);

        /**
         * Без этого не будет работать Raycaster до первого рендеринга,
         * а это нужно в конструкторах для определения краёв экрана в
         * мировом пространстве
         */
        camera.updateWorldMatrix(false, false);

        /**
         * ProjectionHelper
         */
        const projectionHelper = new ProjectionHelper(
            renderer.domElement.width,
            renderer.domElement.height,
            camera
        );

        /**
         * Physics
         */
        const engine = Engine.create({
            gravity: { x: 0, y: 0 },
            // TODO: не работает засыпание, предметы просто зависают
            enableSleeping: false,
        });

        /**
         * Lil
         */
        const lil = new GUI({ title: 'Настройки' });

        if (!window.location.search.includes('debug')) {
            lil.hide();
        }

        const systemsRuntime = this.configureSystems(
            renderer,
            composer,
            camera,
            scene,
            engine,
            projectionHelper,
            lil
        );

        let lastTime = performance.now();

        function animate(time: number): void {
            requestAnimationFrame(animate);

            const deltaMs = time - lastTime;
            const deltaS = deltaMs / 1000;
            lastTime = time;

            systemsRuntime.update(
                // Когда вкладка становится неактивной, в deltaS накапливается
                // очень большое время. При возвращении назад во вкладку, происходит
                // взрыв физики если передать его в таком виде
                deltaS > 0.1 ? 0.1 : deltaS
            );

            composer.render(deltaMs);
        }

        animate(performance.now());

        void yandexSdk.then((sdk) => sdk.features.LoadingAPI?.ready());
    }

    /**
     * Renderer
     */
    private configureRenderer() {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        document.body.appendChild(renderer.domElement);

        this.screenSizeSource.subscribe((w, h) => {
            renderer.setSize(w, h, false);
        });

        const composer = new EffectComposer(renderer);

        return { renderer, composer };
    }

    protected abstract configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        engine: Engine,
        projectionHelper: ProjectionHelper,
        lil: GUI
    ): Runtime;
}
