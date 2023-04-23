import * as THREE from 'three';

export class Gun {
    public readonly direction = new THREE.Vector3();
    public angle = 0.3;
    public untilNextShotSec = 0;
    public delayBetweenShotsSec = 0.6;
    public targetMask = -1;
}
