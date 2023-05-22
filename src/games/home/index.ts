import { start, world, scene, systemsRuntime, havok, playerCamera } from '~/game';
import { LevelSystem } from '~/systems/LevelSystem';
import { LightSwitchSystem } from '~/systems/LightSwitchSystem';

/**
 * Camera
 */
// Средний рост женщины минус примерно расстояние до глаз
playerCamera.position.y = 1.65 - 0.15;

/**
 * Systems
 */
systemsRuntime.addSystem(new LevelSystem(world, scene, havok));
systemsRuntime.addSystem(new LightSwitchSystem(world, scene));

start();
