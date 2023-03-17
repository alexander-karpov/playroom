import { System, type World } from '../ecs';
import GUI from 'lil-gui';
import { Application } from '../components';
import { hslToRgb } from '../utils/hslToRgb';


export class LilSystem extends System {
    public override onCreate(world: World): void {
        const gui = new GUI();

        const config = {
            h: 0.5,
            s: 0.5,
            l: 0.5,
        };

        function onUpdateColor(): void {
            const app = world.firstComponent(Application);
            app.renderer.background.color = hslToRgb(config.h, config.s, config.l);
        }

        gui.add(config, 'h', 0, 1, 0.01).onChange(onUpdateColor);
        gui.add(config, 's', 0, 1, 0.01).onChange(onUpdateColor);
        gui.add(config, 'l', 0, 1, 0.01).onChange(onUpdateColor);
    }
}
