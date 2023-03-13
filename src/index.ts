import { Runtime } from './ecs';
import { ApplicationSystem, MouseSystem, SceneSystem } from './core';
import { Ticker } from 'pixi.js';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

const game = new Runtime([
    new ApplicationSystem(),
    new MouseSystem(),
    new SceneSystem(),
]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaS = (time - lastTime) / 1000;
    lastTime = time;

    game.update(deltaS);
}

animate(performance.now());