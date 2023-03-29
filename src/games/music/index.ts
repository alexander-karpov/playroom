import { Runtime } from '@ecs';
import { ApplicationSystem } from '@systems/ApplicationSystem';
import { Ticker } from 'pixi.js';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import { GameSystem } from './systems/GameSystem';
import { AudioSystem, type AudioSystemOptions } from '@systems/AudioSystem';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();

const audio: AudioSystemOptions = {
    soundsOn: true,
    soundsVolume: 70,
};

const game = new Runtime([new GameSystem(), new AudioSystem(audio), new ApplicationSystem()]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    lastTime = time;

    game.update(delta);
}

animate(performance.now());
