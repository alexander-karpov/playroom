import { Vector } from 'matter-js';
import type { IPointData } from 'pixi.js';

export function starShape(
    r: number,
    angle: number
): [allPoints: IPointData[], tips: IPointData[]] {
    const point = Vector.create(0, -r);
    const hole = Vector.rotate(Vector.create(0, -r * 0.618), Math.PI / 5);

    const wholeShape: IPointData[] = [];
    const tips: IPointData[] = [];

    for (let i = 0; i < 5; i++) {
        const tip = Vector.rotate(point, ((Math.PI * 2) / 5) * i);

        tips.push(tip);
        wholeShape.push(tip);

        wholeShape.push(Vector.rotate(hole, ((Math.PI * 2) / 5) * i));
    }

    return [wholeShape, tips];
}
