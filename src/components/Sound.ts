import type * as THREE from 'three';
import { type SoundTrack } from '~/systems/AudioSystem';

export class Sound {
    public track!: SoundTrack;
    public audio!: THREE.PositionalAudio;
}
