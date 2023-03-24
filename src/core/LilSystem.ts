import { System, type World } from '../ecs';
import GUI from 'lil-gui';
import { nameof } from '../utils/nameof';
import type { FollowingCameraSystemOptions, AudioSystemOptions } from '.';
import { Actor, Player } from '../components';


export class LilSystem extends System {
    private readonly gui = new GUI({ title: 'Настройки' });

    public constructor(
        private readonly camera: FollowingCameraSystemOptions,
        private readonly audio: AudioSystemOptions,
    ) {
        super();
    }

    public override onCreate(world: World): void {
        // gui.add(this.camera, nameof<FollowingCameraSystemOptions>('followingSpeed'), 0, 20, 0.1);
        this.gui
            .add(this.audio, nameof<AudioSystemOptions>('soundsOn'))
            .name('Звуки')
            .onChange((value: boolean) => soundsVolume.enable(value));


        const soundsVolume = this.gui
            .add(this.audio, nameof<AudioSystemOptions>('soundsVolume'), 0, 100, 5)
            .name('Громкость звуков');
    }

    public override onSometimes(world: World): void {
        const actor = world.getComponent(Actor, world.first([Player, Actor]));

        if (actor.body.speed > 1) {
            this.gui.close();
        }
    }
}
