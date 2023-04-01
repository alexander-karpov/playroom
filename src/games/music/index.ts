import { Runtime } from '@ecs';
import { Ticker } from 'pixi.js';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import { SceneSystem } from './SceneSystem';
import { PhysicsSystem } from '@systems/PhysicsSystem';
import { AudioSystem } from '@systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsManagerSystem } from './StarsManagerSystem';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();

const systemsRuntime = new Runtime([
    new SceneSystem(),
    new PhysicsSystem(),
    new AudioSystem(),
    new PuzzleSystem(),
    new StarsManagerSystem(),
]);

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaS = (time - lastTime) / 1000;
    lastTime = time;

    systemsRuntime.update(
        // Когда вкладка становится неактивной, в deltaS накапливается
        // очень большое время. При возвращении назад во вкладку, происходит
        // взрыв физики если передать его в таком виде
        deltaS > 0.1 ? 0.1 : deltaS
    );
}

animate(performance.now());

// @ts-ignore
window.game = systemsRuntime;
