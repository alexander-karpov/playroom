import * as THREE from 'three';
import { type ComponentClass } from '~/ecs/ComponentClass';
import { type SoundTrack } from '~/games/space/systems/AudioSystem';

export class Gun {
    public readonly direction = new THREE.Vector3();
    public untilNextShotSec = 0;
    public fireRate = 0.6;
    public projectileSize = 1;
    public readonly targetQuery: ComponentClass[] = [];
    public sound: SoundTrack[] = [];
    public readonly color = new THREE.Color(0x60ff00);
}
