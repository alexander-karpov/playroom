import * as THREE from 'three';

export class Bullet {
    public readonly position = new THREE.Vector3(0, 0);
    public readonly direction = new THREE.Vector3(0, 1);

    public speed = 24;
    public untilDeactivationSec = 1;
    public targetMask = -1;
    public damage = 1;

    public static copy(from: Bullet, to: Bullet) {
        to.position.copy(from.position);
        to.direction.copy(from.direction);

        to.speed = from.speed;
        to.untilDeactivationSec = from.untilDeactivationSec;
        to.targetMask = from.targetMask;
        to.damage = from.damage;
    }
}
