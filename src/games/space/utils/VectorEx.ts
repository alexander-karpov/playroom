import { Vector } from 'matter-js';

export class VectorEx {
    public static copyFrom(from: Vector, result: Vector): void {
        result.x = from.x;
        result.y = from.y;
    }

    public static distanceSq(a: Vector, b: Vector): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;

        return dx * dx + dy * dy;
    }

    public static directionFrom(from: Vector, to: Vector, result: Vector) {
        VectorEx.copyFrom(to, result);
        Vector.sub(result, from, result);
        VectorEx.normaliseThis(result);
    }

    public static normaliseThis(vector: Vector) {
        const magnitude = Vector.magnitude(vector);

        if (magnitude === 0) {
            vector.x = 0;
            vector.y = 0;

            return;
        }

        vector.x /= magnitude;
        vector.y /= magnitude;
    }
}
