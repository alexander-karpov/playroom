import { start, world, scene, systemsRuntime, havok, playerCamera } from '~/game';
import { LevelSystem } from '~/systems/LevelSystem';

// Средний рост женщины минус примерно расстояние до глаз
playerCamera.position.y = 1.65 - 0.15;

systemsRuntime.addSystem(new LevelSystem(world, scene, havok));

start();
