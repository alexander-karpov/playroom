import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, World } from '~/ecs';
import { FirstPersonCamera } from './FirstPersonCamera';
import { type DebugableSystem } from './systems/DebugableSystem';
import { TapSystem } from './systems/TapSystem';
import { HandSystem } from './systems/HandSystem';

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
 * Physics
 */
export const havok = (async () => {
    const havokInstance = await HavokPhysics();

    const hk = new HavokPlugin(true, havokInstance);
    scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

    return hk;
})();

/**
 * Camera
 */
export const playerCamera = new FirstPersonCamera(new Vector3(0, 1.6, 0), scene, havok);
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
 * Render loop
 */
export function start() {
    engine.runRenderLoop(() => {
        scene.render();
    });
}

/**
 * Physics related systems
 */
void havok.then((hk) => {
    systemsRuntime.addSystem(new TapSystem(world, scene, playerCamera, hk));
    systemsRuntime.addSystem(new HandSystem(world, scene, playerCamera, hk));
});
