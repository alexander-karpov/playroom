import { Runtime } from './ecs';
import type { FollowingCameraSystemOptions, AudioSystemOptions } from './core';
import { AudioSystem, ApplicationSystem, MouseSystem, SceneSystem, FollowingCameraSystem, HintsSystem, LevelsSystem, LilSystem, DustSystem } from './core';
import { Ticker } from 'pixi.js';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

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
    new LevelsSystem(),
    new HintsSystem(),
    new MouseSystem(),
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