import type * as THREE from 'three';

export function isMeshBasicMaterial(material: THREE.Material): material is THREE.MeshBasicMaterial {
    return material.type === 'MeshBasicMaterial';
}
