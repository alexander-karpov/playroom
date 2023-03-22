import { System, type World } from '../ecs';
import { Sound } from '../components';
import { Common } from 'matter-js';

export const sounds = [
    'xylophone-a.wav',
    'xylophone-b.wav',
    'xylophone-c.wav',
    'xylophone-c2.wav',
    'xylophone-d1.wav',
    'xylophone-e1.wav',
    'xylophone-f.wav',
    'xylophone-g.wav',
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
        for (const soundName of sounds) {
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

                if (audio &&
                    // Чтобы избежать трели одного и того же звука
                    (audio.paused || audio.currentTime > 0.3)
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
