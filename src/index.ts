import { Runtime } from './ecs';
import { ApplicationSystem, MouseSystem, SceneSystem, FollowingCameraSystem, HintsSystem, LevelsSystem, LilSystem, DustSystem } from './core';
import { Ticker } from 'pixi.js';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

const game = new Runtime([
    new LevelsSystem(),
    new HintsSystem(),
    new MouseSystem(),
    new FollowingCameraSystem(),
    new SceneSystem(),
    new LilSystem(),
    new DustSystem(),
    new ApplicationSystem(),
]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const delta = (time - lastTime);
    lastTime = time;

    game.update(delta);
}

animate(performance.now());