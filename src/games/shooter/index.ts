import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { ShooterCamera } from './ShooterCamera';
import { type ShooterSystem } from './ShooterSystem';
import { HandsSystem } from './HandsSystem';

void (async () => {
    // Get the canvas element from the DOM.
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    // Associate a Babylon Engine to it.
    const engine = new Engine(canvas);

    /**
     * Scene
     */
    const scene = new Scene(engine);

    /**
     * Camera
     */
    const camera = new ShooterCamera('playerCamera', new Vector3(0, 1.7, 0), scene);
    camera.attachControl(undefined);

    /**
     * Physics
     */

    const havokInstance = await HavokPhysics();

    const hk = new HavokPlugin(true, havokInstance);

    // enable physics in the scene with a gravity
    scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

    /**
     * Systems
     */
    const world = new World();

    const systemsRuntime = new Runtime<ShooterSystem>(world);

    for (const system of [new SceneSystem(world, scene), new HandsSystem(world, scene, hk)]) {
        systemsRuntime.addSystem(system);
    }

    /**
     * Resize
     */
    window.addEventListener('resize', function () {
        engine.resize();
    });

    /**
     * Debug
     */
    if (process.env['NODE_ENV'] !== 'production') {
        const { GUI } = await import('lil-gui');
        const lil = new GUI({ title: 'Настройки' });

        const { DebugCameraSystem } = await import('./DebugCameraSystem');

        systemsRuntime.addSystem(new DebugCameraSystem(world, scene));
        systemsRuntime.forEach((s) => s.onDebug(lil));
    }

    /**
     * Unhandled Errors
     */
    if (process.env['NODE_ENV'] !== 'production') {
        window.onerror = function onUnhandledError(
            event: Event | string,
            source?: string,
            lineno?: number,
            colno?: number,
            error?: Error
        ) {
            alert(`${event.toString()}\nsource ${source ?? ''}\nerror ${error?.message ?? ''}`);
        };
    }

    /**
     * Run render loop
     */
    engine.runRenderLoop(() => {
        systemsRuntime.update(engine.getDeltaTime() / 1000);

        scene.render();
    });
})();
