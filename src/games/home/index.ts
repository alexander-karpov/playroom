import { start, world, scene, systemsRuntime, havok } from '~/game';
import { EnvironmentSystem } from './EnvironmentSystem';
import { LevelSystem } from './LevelSystem';
import { LightSwitchSystem } from '~/systems/LightSwitchSystem';
import { TapSystem } from '~/systems/TapSystem';
import { HandSystem } from '~/systems/HandSystem';
import { FirstPersonCamera } from '~/FirstPersonCamera';
import { Vector3 } from '@babylonjs/core/Maths/math';

/**
 * Camera
 */
const playerCamera = new FirstPersonCamera(new Vector3(0, 1.6, 0), scene, havok);
playerCamera.attachControl(undefined);

// Средний рост женщины минус примерно расстояние до глаз
playerCamera.position.y = 1.65 - 0.15;

/**
 * Systems
 */
systemsRuntime.addSystem(new LevelSystem(world, scene, havok));
systemsRuntime.addSystem(new LightSwitchSystem(world, scene));
systemsRuntime.addSystem(new EnvironmentSystem(world, scene));

/**
 * Physics related systems
 */
void havok.then((hk) => {
    systemsRuntime.addSystem(new TapSystem(world, scene, playerCamera, hk));
    systemsRuntime.addSystem(new HandSystem(world, scene, playerCamera, hk));
});

start();
