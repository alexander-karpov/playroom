import { System, type World } from '@ecs';
import { Sound } from '../games/stranger/components';

export enum SoundTracks {
    XylophoneC = 'xylophone-c.ogg',
    XylophoneD1 = 'xylophone-d1.ogg',
    XylophoneE1 = 'xylophone-e1.ogg',
    XylophoneF = 'xylophone-f.ogg',
    XylophoneG = 'xylophone-g.ogg',
    XylophoneA = 'xylophone-a.ogg',
    XylophoneB = 'xylophone-b.ogg',
    XylophoneC2 = 'xylophone-c2.ogg',
}

export class AudioSystem extends System {
    private readonly HTMLAudioElems = new Map<string, HTMLAudioElement>();

    public override onCreate(world: World): void {
        /**
         * Create audio elements, load sounds
         */
        for (const soundName of Object.values(SoundTracks)) {
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

            const sound = world.getComponent(Sound, entity);
            const audio = this.HTMLAudioElems.get(sound.name);

            if (
                audio &&
                // Чтобы избежать трели одного и того же звука
                (audio.paused || audio.currentTime > sound.throttleMs / 1000)
            ) {
                audio.currentTime = 0;
                audio.volume = 0.7;
                void audio.play();
            }

            world.deleteComponent(Sound, entity);
        }
    }
}
