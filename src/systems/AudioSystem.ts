import { System, type World } from '~/ecs';
import { Active, GameObject, Sound } from '~/components';
import * as THREE from 'three';
import { PositionalAudio } from 'three';
import { Player } from '~/games/space/Player';
// TODO неправильная зависимость

export enum SoundTrack {
    TieBasterLong01 = 'tie_blaster_long01.ogg',
    XWingBaster01 = 'lite_blaster01.ogg',
    BulletMetalHit01 = 'bullet-metal-hit-1.ogg',
    BulletMetalHit02 = 'bullet-metal-hit-2.ogg',
    BulletMetalHit03 = 'bullet-metal-hit-3.ogg',
    BulletMetalHit04 = 'bullet-metal-hit-4.ogg',
    BulletMetalHit05 = 'bullet-metal-hit-5.ogg',
    Explosion02 = 'explosion02.ogg',
}

export class AudioSystem extends System {
    private readonly listener = new THREE.AudioListener();
    private readonly audioLoader = new THREE.AudioLoader();
    private readonly buffers = new Map<string, AudioBuffer>();
    private readonly audios: THREE.PositionalAudio[] = [];

    public constructor(private readonly world: World) {
        super();

        this.loadAudioBuffers();

        world.onAttach([Player, GameObject], (world, id) => {
            const { object3d } = world.get(id, GameObject);
            object3d.add(this.listener);
        });

        world.onAttach([Sound, GameObject], (world, id) => {
            const sound = world.get(id, Sound);
            const audio = this.allocAudio();
            const buffer = this.buffers.get(sound.track!)!;
            const { object3d } = world.get(id, GameObject);

            object3d.add(audio);

            audio.setLoop(false);
            audio.setBuffer(buffer);
            audio.play();

            world.detach(id, Sound);
        });
    }

    private allocAudio(): PositionalAudio {
        const ended = this.audios.find((a) => !a.isPlaying);

        if (ended) {
            return ended;
        }

        const audio = new PositionalAudio(this.listener);
        audio.setRefDistance(128);

        this.audios.push(audio);
        return audio;
    }

    private loadAudioBuffers() {
        for (const track of Object.values(SoundTrack)) {
            this.audioLoader.load(`./assets/sounds/${track}`, (buffer) => {
                this.buffers.set(track, buffer);
            });
        }
    }
}
