import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { CharacterControllerSystem } from './CharacterControllerSystem';
import { PlayerControllerSystem } from './PlayerControllerSystem';
import { Observable, type Observer } from '@babylonjs/core/Misc/observable';
import { CameraInputsManager } from '@babylonjs/core/Cameras/cameraInputsManager';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { ScreenSizeBlock } from '@babylonjs/core/Materials/Node/Blocks/Fragment/screenSizeBlock';
import { JoystickAxis, VirtualJoystick } from '@babylonjs/core/Misc/virtualJoystick';
import { ZonedFreeCameraMouseInput } from './ZonedFreeCameraMouseInput';
import { Vector2 } from 'three';

const ss = new ScreenSizeBlock('ScreenSizeBlock01');

// Get the canvas element from the DOM.
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

// Associate a Babylon Engine to it.
const engine = new Engine(canvas);

/**
 * Scene
 */
const scene = new Scene(engine);

// scene.onPointerDown = () => {
//     engine.enterPointerlock();
// };

/**
 * Camera
 */
// const camera = new FreeCamera('camera1', new Vector3(0, 2, -10), scene);
const camera = new TargetCamera('camera1', new Vector3(0, 2, -10), scene);

camera.inertia = 0;

// camera.inputs.clear();
// camera.inputs.add(new ZonedFreeCameraMouseInput());

// // This attaches the camera to the canvas
// camera.attachControl(canvas, true);

// @ts-expect-error Переопределяем приватные методы
class InvisibleVirtualJoystick extends VirtualJoystick {
    private override _drawPuck() {}
    private override _drawVirtualJoystick() {}

    private override _onPointerDown(e: PointerEvent) {
        this.deltaPosition.set(0, 0, 0);

        // @ts-expect-error Вызов приватного метода
        (super._onPointerDown as (e: PointerEvent) => void)(e);
    }
}

const leftJoystick = new VirtualJoystick(true);
const rightJoystick = new InvisibleVirtualJoystick(false, {
    // puckSize: ,
    // containerSize: 0,
    limitToContainer: false,
});

// setInterval(() => {
//     // console.log(camera.cameraRotation.x);
//     // camera.cameraRotation.y += Math.PI * 0.05;
//     // console.log(camera.cameraRotation.x);
//     camera.inputs.clear();
// }, 3000);

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
        // new PlayerControllerSystem(world, scene, camera),
    ]) {
        systemsRuntime.addSystem(system);
    }

    const lastJoystickValue = new Vector2(0, 0);
    const currentPos = new Vector2(0, 0);
    rightJoystick.setJoystickSensibility(1);

    /**
     * Loop
     */
    engine.runRenderLoop(() => {
        systemsRuntime.update(engine.getDeltaTime() / 1000);

        if (rightJoystick.pressed) {
            lastJoystickValue.copy(currentPos);
            currentPos.set(rightJoystick.deltaPosition.x, rightJoystick.deltaPosition.y);

            const dy = rightJoystick.deltaPosition.y - lastJoystickValue.y;
            const dx = rightJoystick.deltaPosition.x - lastJoystickValue.x;

            camera.cameraRotation.set(-dy * engine.getDeltaTime(), dx * engine.getDeltaTime());
        } else {
            lastJoystickValue.set(0, 0);
            currentPos.set(0, 0);
        }

        scene.render();
    });
})();

window.addEventListener('resize', function () {
    engine.resize();
});
