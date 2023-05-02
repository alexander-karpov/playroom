import { System, type World } from '~/ecs';
import { Active, GameObject, Sound } from '~/components';
import * as THREE from 'three';
import { Player } from '~/games/windrunners/Player';

export enum SoundTrack {
    TieBasterLong01 = 'tie_blaster_long01.ogg',
    XWingBaster01 = 'xwing_blaster01.ogg',
}

export class AudioSystem extends System {
    private readonly listener = new THREE.AudioListener();
    private readonly audioLoader = new THREE.AudioLoader();
    private readonly buffers = new Map<string, AudioBuffer>();

    public constructor(private readonly world: World) {
        super();

        this.loadAudioBuffers();

        world.onAttach([Player, GameObject], (world, id) => {
            const { object3d } = world.get(id, GameObject);
            object3d.add(this.listener);
        });

        world.onAttach([Sound, GameObject, Active], (world, id) => {
            this.attachAudioSource(world, id);

            const sound = world.get(id, Sound);

            if (sound.track && sound.audio) {
                const buffer = this.buffers.get(sound.track);

                if (buffer) {
                    sound.audio.stop();
                    sound.audio.setBuffer(buffer);
                    sound.audio.play();
                }
            }
        });

        world.onDetach([Sound, GameObject, Active], (world, id) => {
            const sound = world.get(id, Sound);

            sound.audio?.stop();
        });
    }

    private attachAudioSource(world: World, soundId: number) {
        const sound = world.get(soundId, Sound);

        if (sound.audio) {
            return;
        }

        sound.audio = new THREE.PositionalAudio(this.listener);
        sound.audio.setRefDistance(64);

        const { object3d } = world.get(soundId, GameObject);
        object3d.add(sound.audio);
    }

    private loadAudioBuffers() {
        for (const track of Object.values(SoundTrack)) {
            this.audioLoader.load(`./assets/sounds/${track}`, (buffer) => {
                this.buffers.set(track, buffer);
            });
        }
    }
}
