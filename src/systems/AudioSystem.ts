import { System, type World } from '@ecs';
import { Sound } from '../games/stranger/components';
import { Common } from 'matter-js';

export const xylophone = [
    'xylophone-c.ogg',
    'xylophone-d1.ogg',
    'xylophone-e1.ogg',
    'xylophone-f.ogg',
    'xylophone-g.ogg',
    'xylophone-a.ogg',
    'xylophone-b.ogg',
    'xylophone-c2.ogg',
] as readonly string[];

export interface AudioSystemOptions {
    soundsOn: boolean;
    soundsVolume: number;
}

export class AudioSystem extends System {
    private readonly HTMLAudioElems = new Map<string, HTMLAudioElement>();

    public constructor(private readonly options: Readonly<AudioSystemOptions>) {
        super();
    }

    public override onCreate(world: World): void {
        // const audio = new Audio('./assets/music/leonell-cassio-a-magical-journey-through-space.mp3');

        // setTimeout(function() {
        //     audio.loop = true;
        //     // void audio.play();
        // }, 4000);

        /**
         * Create audio elements, load sounds
         */
        for (const soundName of xylophone) {
            this.HTMLAudioElems.set(soundName, new Audio(`./assets/sounds/${soundName}`));
        }
    }

    public override onOutput(world: World): void {
        /**
         * Play sounds
         */

        const withSound = world.select([Sound]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < withSound.length; i++) {
            const entity = withSound[i]!;

            if (this.options.soundsOn) {
                const sound = world.getComponent(Sound, entity);
                const audio = this.HTMLAudioElems.get(sound.name);

                if (
                    audio &&
                    // Чтобы избежать трели одного и того же звука
                    (audio.paused || audio.currentTime > sound.throttleMs / 1000)
                ) {
                    audio.volume = Common.clamp(this.options.soundsVolume, 0, 100) / 100;
                    audio.currentTime = 0;
                    void audio.play();
                }
            }

            world.deleteComponent(Sound, entity);
        }
    }
}
