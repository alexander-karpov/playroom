import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Сущность нажата с удержанием
 */
export class LongTap {
    public readonly point: Vector3 = new Vector3();
    public readonly normal: Vector3 = new Vector3();
}
