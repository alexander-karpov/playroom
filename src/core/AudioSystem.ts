import { System, type World } from '../ecs';
import { Sound } from '../components';

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

export class AudioSystem extends System {
    private readonly audioElements = new Map<string, HTMLAudioElement>();

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
            this.audioElements.set(soundName, new Audio(`./assets/sounds/${soundName}`));
        }
    }

    public override onOutput(world: World): void {
        /**
         * Create audio elements
         */
        const entities = world.select([Sound]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i]!;
            const sound = world.getComponent(Sound, entity);
            const audio = this.audioElements.get(sound.name);

            if (audio) {
                audio.currentTime = 0;
                void audio.play();

                world.deleteComponent(Sound, entity);
            }
        }
    }
}
