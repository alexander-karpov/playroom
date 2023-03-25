import { Runtime } from '@ecs';
import type { FollowingCameraSystemOptions, AudioSystemOptions } from './systems';
import { AudioSystem, ApplicationSystem, UserInputSystem, SceneSystem, FollowingCameraSystem, HintsSystem, PuzzleSystem, LilSystem, DustSystem } from './systems';
import { Ticker } from 'pixi.js';
import { Common } from 'matter-js';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

// @ts-expect-error
if (typeof Common._seed !== 'number') {
    throw new Error('Пропало поле Common._seed');
}

// @ts-expect-error
Common._seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

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

    const delta = (time - lastTime);
    lastTime = time;

    game.update(delta);
}

animate(performance.now());