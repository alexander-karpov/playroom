import { Runtime, World } from '~/ecs';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { FpsCameraSystem } from './FpsCameraSystem';
import { SceneSystem } from './SceneSystem';

export class ShooterGame extends Game {
    protected override configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        lil: GUI
    ): Runtime {
        /**
         * Systems
         */
        const world = new World();

        const systemsRuntime = new Runtime(world);

        for (const system of [
            new SceneSystem(world, scene),
            new FpsCameraSystem(world, camera, renderer),
        ]) {
            systemsRuntime.addSystem(system);
        }

        return systemsRuntime;
    }

    protected override createCamera(): THREE.Camera {
        const camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );

        camera.rotation.order = 'YXZ';

        this.screenSize.consume((w, h) => {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });

        return camera;
    }
}
