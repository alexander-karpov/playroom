import { DemoSystem } from './core/DemoSystem';
import { RenderingSystem } from './core/RenderingSystem';
import { Simulation } from './ecs'


const sim = new Simulation();

sim.addSystem(new RenderingSystem());
sim.addSystem(new DemoSystem());

function update() {
    sim.update();

    requestAnimationFrame(update);
}

update();
