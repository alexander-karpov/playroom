import * as THREE from 'three';

export class Bullet {
    public readonly position = new THREE.Vector3(0, 0);
    public readonly direction = new THREE.Vector3(0, 1);
    public readonly speed = 5;
}
