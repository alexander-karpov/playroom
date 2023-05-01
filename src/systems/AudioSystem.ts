import { System, type World } from '~/ecs';
import { Active, GameObject, Sound } from '~/components';
import * as THREE from 'three';
import { Player } from '~/games/windrunners/Player';

export enum SoundTrack {
    TieBasterLong01 = 'tie_blaster_long01.ogg',
}

export class AudioSystem extends System {
    private readonly listener = new THREE.AudioListener();
    private readonly audioLoader = new THREE.AudioLoader();

    public constructor(private readonly world: World) {
        super();

        world.onAttach([Player, GameObject], (world, id) => {
            const { object3d } = world.get(id, GameObject);
            object3d.add(this.listener);
        });

        let tie_blaster01buffer: AudioBuffer;

        this.audioLoader.load(`./assets/sounds/${SoundTrack.TieBasterLong01}`, function (buffer) {
            tie_blaster01buffer = buffer;
        });

        world.onAttach([Sound, GameObject], (world, id) => {
            const audio = new THREE.PositionalAudio(this.listener);
            audio.setRefDistance(64);

            const sound = world.get(id, Sound);
            sound.audio = audio;

            const { object3d } = world.get(id, GameObject);
            object3d.add(sound.audio);
        });

        world.onAttach([Sound, GameObject, Active], (world, id) => {
            const sound = world.get(id, Sound);

            sound.audio.setBuffer(tie_blaster01buffer);
            sound.audio.stop();
            sound.audio.play();
        });

        world.onDetach([Sound, GameObject, Active], (world, id) => {
            const sound = world.get(id, Sound);

            sound.audio.stop();
        });
    }
}
