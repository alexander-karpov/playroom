import { Shape, ShapeGeometry, Vector2 } from 'three';

export class StarGeometry extends ShapeGeometry {
    public readonly shape: Shape;
    public constructor(radius: number) {
        const shape = StarGeometry.buildStarShape(radius);

        super(shape);
        this.shape = shape;
    }

    private static buildStarShape(radius: number): Shape {
        const shape = new Shape();
        const center = new Vector2(0, 0);

        const tip = new Vector2(0, radius);
        const hollow = new Vector2(0, radius * 0.618).rotateAround(center, Math.PI / 5);

        shape.moveTo(tip.x, tip.y);
        shape.lineTo(hollow.x, hollow.y);

        for (let i = 0; i < 4; i++) {
            tip.rotateAround(center, (Math.PI * 2) / 5);
            hollow.rotateAround(center, (Math.PI * 2) / 5);

            shape.lineTo(tip.x, tip.y);
            shape.lineTo(hollow.x, hollow.y);
        }

        return shape;
    }
}
