import * as THREE from 'three';

export class Bullet {
    public readonly position = new THREE.Vector3(0, 0);
    public readonly direction = new THREE.Vector3(0, 1);
    public speed = 1;
    public beforeDeactivationSec = 1;

    public static copy(from: Bullet, to: Bullet) {
        to.position.copy(from.position);
        to.direction.copy(from.direction);
        to.beforeDeactivationSec = from.beforeDeactivationSec;
        to.speed = from.speed;
    }
}
