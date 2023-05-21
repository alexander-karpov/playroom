import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Runtime, World } from '~/ecs';
import { FirstPersonCamera } from './FirstPersonCamera';
import { type DebugableSystem } from './systems/DebugableSystem';
import { HandSystem } from './games/shooter/HandSystem';

/**
 * Canvas
 */
export const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

/**
 * Engine
 */
export const engine = new Engine(canvas);

/**
 * Scene
 */
export const scene = new Scene(engine);

/**
 * Directional Light
 */
const directionalLight = new DirectionalLight(
    'directional',
    new Vector3(-0.5, -0.65, -0.57),
    scene
);

directionalLight.radius = 0.04;
directionalLight.intensity = 2.5;

/**
 * Camera
 */
export const playerCamera = new FirstPersonCamera('playerCamera', new Vector3(0, 1.6, 0), scene);
playerCamera.attachControl(undefined);

/**
 * ECS
 */
export const world = new World();
export const systemsRuntime = new Runtime<DebugableSystem>(world);

scene.onBeforeRenderObservable.add(() => systemsRuntime.update(engine.getDeltaTime() / 1000));

/**
 * Resize
 */
window.addEventListener('resize', function () {
    engine.resize();
});

/**
 * Debug systems
 */
if (process.env['NODE_ENV'] !== 'production') {
    void (async () => {
        const { GUI } = await import('lil-gui');
        const lil = new GUI({ title: 'Настройки' });

        const { DebugCameraSystem } = await import('./games/shooter/DebugCameraSystem');

        systemsRuntime.addSystem(new DebugCameraSystem(world, scene));
        systemsRuntime.forEvery((s) => s.onDebug(lil));
    })();
}

/**
 * Errors alert
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
 * Render loop
 */
export function start() {
    engine.runRenderLoop(() => {
        scene.render();
    });
}

/**
 * Physics
 */

export const havok = (async () => {
    const havokInstance = await HavokPhysics();

    const hk = new HavokPlugin(true, havokInstance);
    scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

    systemsRuntime.addSystem(new HandSystem(world, scene, playerCamera, hk));

    return hk;
})();
