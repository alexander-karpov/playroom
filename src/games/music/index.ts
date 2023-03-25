import { Runtime } from '@ecs';
import { ApplicationSystem } from '@systems';
import { Ticker } from 'pixi.js';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();


const game = new Runtime([
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