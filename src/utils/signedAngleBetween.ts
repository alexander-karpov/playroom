import type * as THREE from 'three';
import { rotationDirection } from './dotBetween';

/**
 * @see https://stackoverflow.com/questions/19675676/calculating-actual-angle-between-two-vectors-in-unity3d
 */
export function signedAngleBetween(
    a: THREE.Vector3,
    b: THREE.Vector3,
    normal: THREE.Vector3
): number {
    // angle in [0,180]
    const angle = a.angleTo(b);
    const dot = rotationDirection(a, b, normal);
    const sign = Math.sign(dot);

    // angle in [-179,180]
    const signed_angle = angle * sign;

    // angle in [0,360] (not used but included here for completeness)
    //float angle360 =  (signed_angle + 180) % 360;
    return signed_angle;
}
