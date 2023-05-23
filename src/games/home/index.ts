import { start, world, scene, systemsRuntime, havok, playerCamera } from '~/game';
import { LevelSystem } from '~/systems/LevelSystem';
import { LightSwitchSystem } from '~/systems/LightSwitchSystem';
import { PistolSystem } from '~/systems/PistolSystem';

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

void havok.then((hk) => {
    systemsRuntime.addSystem(new PistolSystem(world, scene, hk));
});

start();
