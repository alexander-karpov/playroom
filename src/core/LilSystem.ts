import { System, type World } from '../ecs';
import GUI from 'lil-gui';
import { nameof } from '../utils/nameof';
import type { FollowingCameraSystemOptions } from './FollowingCameraSystem';


export class LilSystem extends System {
    public constructor(private readonly camera: FollowingCameraSystemOptions) {
        super();
    }

    public override onLink(world: World): void {
        const gui = new GUI();

        gui.add(this.camera, nameof<FollowingCameraSystemOptions>('followingSpeed'), 0, 20, 0.1);
    }
}
