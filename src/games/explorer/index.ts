import { start, world, scene, systemsRuntime, havok } from '~/game';
import { WorldSystem } from './WorldSystem';
import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { OrthographicCameraSystem } from './OrthographicCameraSystem';

/**
 * Systems
 */
systemsRuntime.addSystem(new WorldSystem(world, scene, havok));

systemsRuntime.addSystem(
    new OrthographicCameraSystem(new TargetCamera('mainCamera', new Vector3(0, 0, 0), scene, true))
);

start();
