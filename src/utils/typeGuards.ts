import type * as THREE from 'three';

export function isMesh(object: THREE.Object3D): object is THREE.Mesh {
    return object.type === 'Mesh';
}

export function isOrthographicCamera(object: THREE.Object3D): object is THREE.OrthographicCamera {
    return object.type === 'OrthographicCamera';
}
