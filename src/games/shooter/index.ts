import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core/Physics';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { CharacterControllerSystem } from './CharacterControllerSystem';
import { PlayerControllerSystem } from './PlayerControllerSystem';

// Get the canvas element from the DOM.
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// Associate a Babylon Engine to it.
const engine = new Engine(canvas);

/**
 * Scene
 */
const scene = new Scene(engine);

scene.onPointerDown = () => {
    engine.enterPointerlock();
};

/**
 * Camera
 */
const camera = new FreeCamera('camera1', new Vector3(0, 2, -10), scene);

camera.inertia = 0;
camera.angularSensibility = 500;
// camera.setTarget(Vector3.Zero());

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

camera.inputs.attached['keyboard']?.detachControl();

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
        new CharacterControllerSystem(world, scene, hk),
        new PlayerControllerSystem(world, scene, camera),
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

window.addEventListener('resize', function () {
    engine.resize();
});
