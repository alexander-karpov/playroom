import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Сущность нажата (без удержанием)
 */
export class Tap {
    public readonly point: Vector3 = new Vector3();
    public readonly normal: Vector3 = new Vector3();
}
