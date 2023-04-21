import type * as THREE from 'three';

export class Airplane {
    public speed!: number;
    public direction!: THREE.Vector3;
    public engineOn!: boolean;
    public turningSpeed!: number;
}
