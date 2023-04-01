import type * as THREE from 'three';

export function isMesh(object: THREE.Object3D): object is THREE.Mesh {
    return object.type === 'Mesh';
}
