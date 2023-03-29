import { Runtime } from '@ecs';
import type { FollowingCameraSystemOptions, AudioSystemOptions } from './systems';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import {
    AudioSystem,
    ApplicationSystem,
    UserInputSystem,
    SceneSystem,
    FollowingCameraSystem,
    HintsSystem,
    PuzzleSystem,
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

const audio: AudioSystemOptions = {
    soundsOn: true,
    soundsVolume: 70,
};

const game = new Runtime([
    new LilSystem(camera, audio),
    new AudioSystem(audio),
    new PuzzleSystem(),
    new HintsSystem(),
    new UserInputSystem(),
    new FollowingCameraSystem(camera),
    new SceneSystem(),
    new DustSystem(),
    new ApplicationSystem(),
]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    lastTime = time;

    game.update(delta);
}

animate(performance.now());
