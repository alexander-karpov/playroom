import * as THREE from 'three';

export class Hitable {
    public readonly sphere = new THREE.Sphere();
    public mask = -1;
    public health = 1;

    public static copy(from: Hitable, to: Hitable) {
        to.sphere.copy(from.sphere);

        to.mask = from.mask;
        to.health = from.health;
    }
}
