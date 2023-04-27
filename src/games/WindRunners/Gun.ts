import * as THREE from 'three';
import { type ComponentClass } from '~/ecs/ComponentClass';

export class Gun {
    public readonly direction = new THREE.Vector3();
    public untilNextShotSec = 0;
    public fireRateInSec = 0.6;
    public readonly targetQuery: ComponentClass[] = [];
}
