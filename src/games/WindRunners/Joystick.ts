import type * as THREE from 'three';

export class Joystick {
    public pointerId!: number;
    public start!: THREE.Vector2;
    public current!: THREE.Vector2;
    public direction!: THREE.Vector2;
    public tilt!: number;
}
