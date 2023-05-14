import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { CharacterControllerSystem } from './CharacterControllerSystem';
import { ShooterCamera } from './ShooterCamera';
import { PlayerControllerSystem } from './PlayerControllerSystem';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';

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
const camera = new ShooterCamera('camera1', new Vector3(0, 2, -10), scene);
camera.attachControl(canvas);

const debugCamera = new ArcRotateCamera('debugCamera', 0, Math.PI / 2, 5, Vector3.Zero(), scene);

debugCamera.attachControl(canvas);
debugCamera.radius = 32;
debugCamera.lowerRadiusLimit = 2;
debugCamera.upperRadiusLimit = 32;

scene.activeCamera = debugCamera;

void (async () => {
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

    const systemsRuntime = new Runtime(world);

    for (const system of [
        new SceneSystem(world, scene),
        new PlayerControllerSystem(world, scene, camera),
        new CharacterControllerSystem(world, scene, hk),
    ]) {
        systemsRuntime.addSystem(system);
    }

    /**
     * Loop
     */
    engine.runRenderLoop(() => {
        systemsRuntime.update(engine.getDeltaTime() / 1000);

        scene.render();
    });
})();

/**
 * Resize
 */
window.addEventListener('resize', function () {
    engine.resize();
});

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
