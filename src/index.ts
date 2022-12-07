import { DemoSystem } from './core/DemoSystem';
import { RenderingSystem } from './core/RenderingSystem';
import { Simulation } from './ecs'


const game = new Simulation([
    new RenderingSystem(),
    new DemoSystem(),
]);


function update() {
    requestAnimationFrame(update);

    game.update();
}

update();
