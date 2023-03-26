import { Actor } from '@components/Actor';
import { System, type World } from '@ecs';
import { fib } from '@utils/fib';
import { hslToRgb } from '@utils/hslToRgb';
import {
    Bodies,
    Vector,
    Common,
    Body,
    Mouse,
    MouseConstraint,
    Composite,
} from 'matter-js';
import { Graphics, PI_2 } from 'pixi.js';
import { starShape } from '../../../graphics/shapes';
import * as bodyExtraProps from '../matterBodyExtraProps';
import { xylophone } from '@systems/AudioSystem';
import { Application } from '@components/Application';

export class GameSystem extends System {
    public override onCreate(world: World): void {
        this.createStar(world, Vector.create(0, 0), 4, Common.random(0, PI_2));
    }

    public override onLink(world: World): void {
        const { physics, mouse, renderer } = world.firstComponent(Application);

        /**
         * Mouse constraint
         */
        const mouseConstraint = MouseConstraint.create(physics, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
            },
        });

        Composite.add(physics.world, mouseConstraint);

        /**
         * Walls
         */

        const halfScreenWidth = renderer.width / 2;
        const halfScreenHeight = renderer.height / 2;
        const wallThickness = Math.max(renderer.width, renderer.height);

        Composite.add(physics.world, [
            // walls
            Bodies.rectangle(
                -halfScreenWidth - wallThickness / 2,
                0,
                wallThickness,
                renderer.height + wallThickness * 2,
                { isStatic: true }
            ),
            Bodies.rectangle(
                halfScreenWidth + wallThickness / 2,
                0,
                wallThickness,
                renderer.height + wallThickness * 2,
                { isStatic: true }
            ),
            Bodies.rectangle(
                0,
                -halfScreenHeight - wallThickness / 2,
                renderer.width + wallThickness * 2,
                wallThickness,
                { isStatic: true }
            ),
            Bodies.rectangle(
                0,
                halfScreenHeight + wallThickness / 2,
                renderer.width + wallThickness * 2,
                wallThickness,
                { isStatic: true }
            ),
        ]);
    }

    private createStar(
        world: World,
        position: Vector,
        size: number,
        angleRad: number
    ): void {
        const r = fib(size + 7);
        const [starId, actor] = world.addEntity(Actor);

        const [starPoints] = starShape(r, 0);

        actor.graphics = new Graphics()
            .beginFill(0xfff000)
            .drawPolygon(starPoints)
            .endFill();

        actor.graphics.position.set(position.x, position.y);
        actor.graphics.tint = hslToRgb(0.61, 0.43, 0.5);

        actor.body = Bodies.fromVertices(position.x, position.y, [starPoints]);
        bodyExtraProps.setEntityId(actor.body, starId);

        bodyExtraProps.setSoundName(
            actor.body,
            xylophone[xylophone.length - size - 2]!
        );

        Body.setAngle(actor.body, angleRad);
        actor.graphics.rotation = angleRad;
    }
}

console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);
