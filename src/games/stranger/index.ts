import { Runtime } from '@ecs';
import type { FollowingCameraSystemOptions } from './systems';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import {
    AudioSystem,
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

const camera: FollowingCameraSystemOptions = {
    followingSpeed: 7,
};

const game = new Runtime([
    new LilSystem(),
    new AudioSystem(),
    new HintsSystem(),
    new UserInputSystem(),
    new FollowingCameraSystem(camera),
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
