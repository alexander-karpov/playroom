import * as THREE from 'three';
import { Bodies, type IBodyDefinition } from 'matter-js';

const box = new THREE.Box3();
const vec3 = new THREE.Vector3();

/**
 * Создаёт Matter.Body подходящей для Object3D формы
 */
export function createBodyForObject3d(
    object3d: THREE.Object3D,
    options: IBodyDefinition,
    maxSides: number
) {
    box.setFromObject(object3d);
    box.getSize(vec3);

    const maxSide = Math.max(vec3.x, vec3.y, vec3.z);

    return Bodies.circle(0, 0, maxSide / 2, options, maxSides);
}
