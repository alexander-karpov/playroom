import { System, type World } from '../ecs';
import { Actor, Rock, Level, Player, Goal, Application } from '../components';
import { Graphics } from 'pixi.js';
import { Bodies, Body, Vector, Common } from 'matter-js';
import { hslToRgb } from '../utils/hslToRgb';
import { choose } from '../utils/choose';
import { sounds } from './AudioSystem';

export class LevelsSystem extends System {
    public override onCreate(world: World): void {

        const baseColor = 0.61;//Math.random();

        const step = 1 / 16;
        const s = 1;
        const l = 0.7;

        const colors = [
            // hslToRgb(baseColor, s, l),
            hslToRgb(baseColor + step, s, l),
            hslToRgb(baseColor + step + step, s, l),
            hslToRgb(baseColor - step, s, l),
            hslToRgb(baseColor - step - step, s, l),
        ];

        function rc(): number {
            return Common.choose(colors) as number;
        }

        for (let i = 0; i < 64; i++) {
            this.createRock(world, Vector.create(Common.random(-1000, 1000), Common.random(-1000, 1000)), 32, 32, rc());
        }
    }


    public override onLink(world: World): void {
        const [, level] = world.addEntity(Level);
        const { renderer } = world.firstComponent(Application);
        level.number = 1;
        level.finished = false;

        renderer.background.color = hslToRgb(0.61, 0.43, 0.32);

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

    private createRock(world: World, position: Vector, w: number, h: number, color: number, isStatic: boolean = false): void {
        const [rockId] = world.addEntity(Rock);
        const actor = world.addComponent(Actor, rockId);

        actor.graphics = new Graphics().beginFill(color).drawRect(0, 0, w, h);
        actor.graphics.pivot.set(w / 2, h / 2);
        actor.graphics.position.set(position.x, position.y);
        actor.body = Bodies.rectangle(position.x, position.y, w, h, { isStatic });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        actor.body.plugin.entityId = rockId;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        actor.body.plugin.soundName = choose(sounds);
    }

    private replaceRocks(world: World, level: number): void {
        const rockIds = world.select([Rock, Actor]);

        if (level === 1) {
            let point = Vector.create(128, 0);

            for (let i = 0; i < 32 && i < rockIds.length; i++) {
                const rockId = rockIds[i]!;
                const { body } = world.getComponent(Actor, rockId);
                Body.setPosition(body, Vector.rotate(point, 0.2 * i));
            }

            point = Vector.create(256, 0);

            for (let i = 32; i < 128 && i < rockIds.length; i++) {
                const rockId = rockIds[i]!;
                const { body } = world.getComponent(Actor, rockId);
                Body.setPosition(body, Vector.rotate(point, 0.1 * i));
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
