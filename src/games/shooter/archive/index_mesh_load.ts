// import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
// import '@babylonjs/core/Loading/loadingScreen';

// import { Engine } from '@babylonjs/core/Engines/engine';
// import { Vector3 } from '@babylonjs/core/Maths/math.vector';
// import { Scene } from '@babylonjs/core/scene';
// import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
// import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
// import HavokPhysics from '@babylonjs/havok';
// import { Runtime, World } from '~/ecs';
// import { SceneSystem } from './SceneSystem';
// import { ShooterCamera } from './ShooterCamera';
// import { type ShooterSystem } from './ShooterSystem';
// import { HandsSystem } from './HandsSystem';
// import { DirectorSystem } from './DirectorSystem';
// import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

// // Это нужно для CubeTexture.CreateFromPrefilteredData
// import '@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader';

// // Это нужно для scene.createDefaultSkybox
// import '@babylonjs/core/Helpers/sceneHelpers.js';

// import '@babylonjs/loaders/glTF';
// import { GLTFLoader } from '@babylonjs/loaders/glTF/2.0/glTFLoader';
// import { GLTFFileLoader } from '@babylonjs/loaders/glTF';

// import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe';

// import '@babylonjs/loaders/glTF';
// import '@babylonjs/loaders/glTF/2.0/glTFLoader';
// import { AssetsManager } from '@babylonjs/core/Misc/assetsManager';

// import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
// import '@babylonjs/core/Loading/loadingScreen';
// import { Engine } from '@babylonjs/core/Engines/engine';

// import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
// import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
// import HavokPhysics from '@babylonjs/havok';

// import '@babylonjs/loaders/glTF';
// import { GLTFLoader } from '@babylonjs/loaders/glTF/2.0/glTFLoader';
// import { GLTFFileLoader } from '@babylonjs/loaders/glTF';
// import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

// // // Это нужно для CubeTexture.CreateFromPrefilteredData
// import '@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader';

// // // Это нужно для scene.createDefaultSkybox
// import '@babylonjs/core/Helpers/sceneHelpers.js';
// import { Mesh } from '@babylonjs/core/Meshes/mesh';

// // Get the canvas element from the DOM.
// const canvas = document.createElement('canvas');
// document.body.appendChild(canvas);

// // Associate a Babylon Engine to it.
// const engine = new Engine(canvas);

// /**
//  * Scene
//  */
// const scene = new Scene(engine);

// // Create a default skybox with an environment.
// const hdrTexture = CubeTexture.CreateFromPrefilteredData(
//     './assets/textures/environment.dds',
//     scene
// );

// scene.createDefaultSkybox(hdrTexture, true);

// // // Append glTF model to scene.
// // SceneLoader.Append('./assets/models/', 'Glock17.glb', scene, function (scene) {
// //     // Create a default arc rotate camera and light.
// //     scene.createDefaultCameraOrLight(true, true, true);

// //     // The default camera looks at the back of the asset.
// //     // Rotate the camera by 180 degrees to the front of the asset.
// //     // @ts-expect-error
// //     if (scene.activeCamera) scene.activeCamera.alpha += Math.PI;
// // });

// // const l = new GLTFFileLoader();

// // l.loadFile(scene, './assets/models/Glock17.glb', function (data) {
// //     console.log(data);
// // });

// void (async () => {
//     const r = await SceneLoader.ImportMeshAsync('Glock17', './assets/models/', 'Glock17.glb');
//     debugger;
//     if (r.meshes[0]) {
//         r.meshes[0].position.y = 2;
//     }

//     // The default camera looks at the back of the asset.
//     // // Rotate the camera by 180 degrees to the front of the asset.
//     // // @ts-expect-error
//     // if (scene.activeCamera) scene.activeCamera.alpha += Math.PI;

//     /**
//      * Camera
//      */
//     const camera = new ShooterCamera('playerCamera', new Vector3(0, 1.6, 0), scene);
//     camera.attachControl(undefined);

//     /**
//      * Physics
//      */

//     const havokInstance = await HavokPhysics();

//     const hk = new HavokPlugin(true, havokInstance);

//     // enable physics in the scene with a gravity
//     scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

//     /**
//      * Systems
//      */
//     const world = new World();

//     const systemsRuntime = new Runtime<ShooterSystem>(world);

//     // for (const system of [
//     //     new SceneSystem(world, scene),
//     //     new HandsSystem(world, scene, camera, hk),
//     //     new DirectorSystem(world, scene),
//     // ]) {
//     //     systemsRuntime.addSystem(system);
//     // }

//     scene.onBeforeRenderObservable.add(() => systemsRuntime.update(engine.getDeltaTime() / 1000));

//     /**
//      * Resize
//      */
//     window.addEventListener('resize', function () {
//         engine.resize();
//     });

//     /**
//      * Debug
//      */
//     if (process.env['NODE_ENV'] !== 'production') {
//         const { GUI } = await import('lil-gui');
//         const lil = new GUI({ title: 'Настройки' });

//         const { DebugCameraSystem } = await import('./DebugCameraSystem');

//         systemsRuntime.addSystem(new DebugCameraSystem(world, scene));
//         systemsRuntime.forEach((s) => s.onDebug(lil));
//     }

//     /**
//      * Unhandled Errors
//      */
//     if (process.env['NODE_ENV'] !== 'production') {
//         window.onerror = function onUnhandledError(
//             event: Event | string,
//             source?: string,
//             lineno?: number,
//             colno?: number,
//             error?: Error
//         ) {
//             alert(`${event.toString()}\nsource ${source ?? ''}\nerror ${error?.message ?? ''}`);
//         };
//     }

//     /**
//      * Loop
//      */
//     engine.runRenderLoop(() => {
//         scene.render();
//     });
// })();
