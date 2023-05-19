import type { Runtime } from '~/ecs';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import GUI from 'lil-gui';
import { ScreenSizeSource } from './utils/ScreenSizeSource';

export abstract class Game {
    protected readonly screenSize = new ScreenSizeSource();
    private isRun = false;

    public run() {
        if (this.isRun) {
            throw new Error('Game already run');
        }

        this.isRun = true;

        /**
         * Scene
         */
        const scene = new THREE.Scene();

        /**
         * Camera
         */
        const camera = this.createCamera();

        /**
         * Renderer
         */
        const { renderer, composer } = this.configureRenderer();

        composer.addPass(new RenderPass(scene, camera));

        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // THREE.LinearSRGBColorSpace;
        // renderer.toneMappingExposure = 3;

        /**
         * Без этого не будет работать Raycaster до первого рендеринга,
         * а это нужно в конструкторах для определения краёв экрана в
         * мировом пространстве
         */
        camera.updateWorldMatrix(false, false);

        /**
         * Lil
         */
        const lil = new GUI({ title: 'Настройки' });

        if (!window.location.search.includes('debug')) {
            lil.hide();
        }

        const systemsRuntime = this.configureSystems(renderer, composer, camera, scene, lil);

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
    }

    protected createCamera(): THREE.Camera {
        const camera = new THREE.OrthographicCamera();

        camera.near = 1;
        camera.far = 10000;
        camera.position.z = 1000;

        this.screenSize.consume((w, h) => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.left = width / -2;
            camera.right = width / 2;
            camera.top = height / 2;
            camera.bottom = height / -2;
            camera.updateProjectionMatrix();
        });

        return camera;
    }

    /**
     * Renderer
     */
    private configureRenderer() {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        document.body.appendChild(renderer.domElement);

        this.screenSize.consume((w, h) => {
            renderer.setSize(w, h, false);
        });

        const composer = new EffectComposer(renderer);

        return { renderer, composer };
    }

    /**
     * Systems
     */
    protected abstract configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        lil: GUI
    ): Runtime;
}