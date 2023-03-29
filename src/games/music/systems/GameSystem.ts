import { Actor } from '@components/Actor';
import { System, type World } from '@ecs';
import { fib } from '@utils/fib';
import { hslToRgb } from '@utils/hslToRgb';
import {
    Bodies,
    Vector,
    Common,
    Body,
    MouseConstraint,
    Composite,
    Bounds,
    Events,
} from 'matter-js';
import { Graphics, PI_2 } from 'pixi.js';
import { starShape } from '../../../graphics/shapes';
import * as bodyExtraProps from '../matterBodyExtraProps';
import { xylophone } from '@systems/AudioSystem';
import { Application, Sound } from '@components';
import { Star } from '../components/Star';
import { choose } from '@utils/choose';

export class GameSystem extends System {
    public override onCreate(world: World): void {
        this.createAtLeastStars(world, 5);
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

        Events.on(mouseConstraint, 'mousedown', (e) => {
            const body = e.source.body as Body | null;
            const entityId = body && bodyExtraProps.entityId(body);

            if (entityId != null) {
                this.onBodyClick(world, entityId);
            }
        });

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

        // renderer.view.addEventListener?.('click', function (e) {
        //     const pointerEvent = e as PointerEvent;

        //     const stars = world.select([Star, Actor]);

        //     const cursorPosition = Vector.create(
        //         pointerEvent.offsetX - stage.position.x,
        //         pointerEvent.offsetY - stage.position.y
        //     );

        //     console.log(cursorPosition);
        //     for (const starId of stars) {
        //         const actor = world.getComponent(Actor, starId);

        //         if (Bounds.contains(actor.body.bounds, cursorPosition)) {
        //             console.log(actor.body.bounds);
        //         }
        //     }
        // });
    }

    private createStar(world: World, position: Vector, size: number, angleRad: number): void {
        const r = fib(size + 7);
        const [starId, actor] = world.addEntity(Actor);
        const star = world.addComponent(Star, starId);

        const [starPoints] = starShape(r, 0);

        actor.graphics = new Graphics().beginFill(0xfff000).drawPolygon(starPoints).endFill();

        actor.graphics.position.set(position.x, position.y);
        actor.graphics.tint = hslToRgb(0.61, 0.43, 0.5);

        actor.body = Bodies.fromVertices(position.x, position.y, [starPoints]);
        bodyExtraProps.setEntityId(actor.body, starId);

        star.soundName = xylophone[xylophone.length - size - 2]!;

        Body.setAngle(actor.body, angleRad);
        actor.graphics.rotation = angleRad;
    }

    private onBodyClick(world: World, entityId: number): void {
        if (world.hasComponent(Star, entityId)) {
            const star = world.getComponent(Star, entityId);

            const [, sound] = world.addEntity(Sound);
            sound.name = star.soundName;
            sound.throttleMs = 0;
            console.log(sound);
        }
    }

    private createAtLeastStars(world: World, num: number): void {
        const stars = world.select([Star]);
        const numMissing = num - stars.length;

        for (let i = 0; i < numMissing; i++) {
            this.createStar(
                world,
                Vector.create(0, 0),
                choose([1, 2, 3, 4]),
                Common.random(0, PI_2)
            );
        }
    }
}

console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);
