import { System, type World } from '../ecs';
import GUI from 'lil-gui';
import { Camera } from '../components';
import { nameof } from '../utils/nameof';


export class LilSystem extends System {
    public override onLink(world: World): void {
        const camera = world.firstComponent(Camera);

        const gui = new GUI();

        gui.add(camera, nameof<Camera>('speed'), 0, 20, 0.1);
    }
}
