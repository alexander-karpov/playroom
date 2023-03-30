import { Runtime } from '@ecs';
import { Ticker } from 'pixi.js';
import { changeMatterJsRandomSeed } from '@utils/changeMatterJsRandomSeed';
import { GameSystem } from './systems/GameSystem';
import { RenderingSystem } from '@systems/RenderingSystem';
import { PhysicsSystem } from '@systems/PhysicsSystem';

Ticker.shared.autoStart = false;
Ticker.shared.stop();

changeMatterJsRandomSeed();

const systemsRuntime = new Runtime([new GameSystem(), new PhysicsSystem(), new RenderingSystem()]);

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
