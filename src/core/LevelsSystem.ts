import { System, type World } from '../ecs';
import { Actor, Rock, Level, Player, Goal } from '../components';
import { Graphics } from 'pixi.js';
import { Events, Bodies, Composite, Body, Vector, Common } from 'matter-js';


export class LevelsSystem extends System {
    public override onCreate(world: World): void {
        const [, level] = world.addEntity(Level);
        level.number = 1;
        level.finished = false;

        function rc(): number {
            return Math.random() * 0xffffff;
        }

        for (let i = 0; i < 31; i++) {
            this.rock(world, Vector.create(Common.random(-1000, 1000), Common.random(-1000, 1000)), 32, 32, rc());
        }
    }


    public override onLink(world: World): void {
        this.movePlayerToStart(world);
        this.replaceRocks(world, 1);
    }

    public override onSimulate(world: World, delta: number): void {
        const level = world.firstComponent(Level);

        if (level.finished) {
            level.finished = false;
            this.replaceRocks(world, level.number);
            this.movePlayerToStart(world);
        }
    }

    private rock(world: World, position: Vector, w: number, h: number, color: number, isStatic: boolean = false): void {
        const [rockId] = world.addEntity(Rock);
        const component = world.addComponent(Actor, rockId);

        component.graphics = new Graphics().beginFill(color).drawRect(0, 0, w, h);
        component.graphics.pivot.set(w / 2, h / 2);
        component.graphics.position.set(position.x, position.y);
        component.body = Bodies.rectangle(position.x, position.y, w, h, { isStatic });
    }

    private replaceRocks(world: World, level: number): void {
        const rockIds = world.select([Rock, Actor]);

        if (level === 1) {
            const point = Vector.create(256, 0);

            for (let i = 0; i < 31 && i < rockIds.length; i++) {
                const rockId = rockIds[i]!;
                const { body } = world.getComponent(Actor, rockId);
                Body.setPosition(body, Vector.rotate(point, 0.2 * i));
            }
        }
    }

    private movePlayerToStart(world: World): void {
        const playerId = world.first([Player, Actor]);
        const playerActor = world.getComponent(Actor, playerId);

        Body.setPosition(playerActor.body, Vector.rotate(
            Vector.create(window.outerWidth * 1, 0),
            Math.random() * 3.14 * 2
        ));

        const goalId = world.first([Goal, Actor]);
        const goalActor = world.getComponent(Actor, goalId);

        Body.setPosition(goalActor.body, Vector.create(0, 0));
    }
}
