import { Runtime } from '@ecs';
import { Ticker } from 'pixi.js';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import { GameSystem } from './systems/GameSystem';
import { RenderingSystem } from '@systems/RenderingSystem';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();

const systemsRuntime = new Runtime([new GameSystem(), new RenderingSystem()]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaS = (time - lastTime) / 1000;
    lastTime = time;

    systemsRuntime.update(deltaS);
}

animate(performance.now());
