import * as THREE from 'three';

const tempVec3 = new THREE.Vector3();

export function rotationDirection(
    a: THREE.Vector3,
    b: THREE.Vector3,
    normal: THREE.Vector3
): number {
    return normal.dot(tempVec3.crossVectors(a, b));
}
