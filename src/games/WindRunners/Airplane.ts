import type * as THREE from 'three';

export class Airplane {
    public speed: number = 800;
    public direction!: THREE.Vector3;
    public engineOn: boolean = false;
    public turningSpeed: number = 4;
}
