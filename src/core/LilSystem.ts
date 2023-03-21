import { System, type World } from '../ecs';
import GUI from 'lil-gui';
import { nameof } from '../utils/nameof';
import type { FollowingCameraSystemOptions, AudioSystemOptions } from '.';


export class LilSystem extends System {
    public constructor(
        private readonly camera: FollowingCameraSystemOptions,
        private readonly audio: AudioSystemOptions,
    ) {
        super();
    }

    public override onCreate(world: World): void {
        const gui = new GUI({
            title: 'Меню'
        });

        // gui.add(this.camera, nameof<FollowingCameraSystemOptions>('followingSpeed'), 0, 20, 0.1);
        gui
            .add(this.audio, nameof<AudioSystemOptions>('soundsOn'))
            .name('Звуки')
            .onChange((value: boolean) => soundsVolume.enable(value));


        const soundsVolume = gui
            .add(this.audio, nameof<AudioSystemOptions>('soundsVolume'), 0, 100, 5)
            .name('Громкость звуков');
    }
}
