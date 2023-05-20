import { start, world, scene, systemsRuntime, havok } from '~/game';
import { LevelSystem } from '~/systems/LevelSystem';

// // Приблизительный уровень глаз ребенка
// playerCamera.position.y = 1.25;

systemsRuntime.addSystem(new LevelSystem(world, scene, havok));

start();
