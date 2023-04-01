import { Runtime } from '@ecs';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import {
    UserInputSystem,
    SceneSystem,
    FollowingCameraSystem,
    HintsSystem,
    LilSystem,
    DustSystem,
} from './systems';
import { Ticker } from 'pixi.js';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();

const game = new Runtime([
    new LilSystem(),
    new HintsSystem(),
    new UserInputSystem(),
    new FollowingCameraSystem(),
    new SceneSystem(),
    new DustSystem(),
]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    lastTime = time;

    game.update(delta);
}

animate(performance.now());
