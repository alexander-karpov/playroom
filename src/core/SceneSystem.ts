import { System, type World } from '../ecs';
import { Application, Actor, Controller, Player, Camera, Goal, Hint, Level, Sound } from '../components';
import { Graphics, type IPointData } from 'pixi.js';
import { Events, Bodies, Composite, Body, Vector } from 'matter-js';
import { starShape } from '../graphics/shapes';

export class SceneSystem extends System {
    public override onCreate(world: World): void {
        function player(x: number, y: number, r: number, color: number): void {
            const [playerId,] = world.addEntity(Player);
            const actor = world.addComponent(Actor, playerId);

            actor.graphics = new Graphics()
                .beginFill(0xffffff)
                .drawCircle(0, 0, r)
                .endFill();

            // const h = 64;
            // const w = 12;
            // const wingW = 8;
            // const wingH = h * 0.382;

            // actor.graphics = new Graphics()
            //     .beginFill(0xffffff)
            //     .moveTo(-w / 2 - wingW, h / 2)
            //     .lineTo(-w / 2, h / 2 - wingH)
            //     .lineTo(-w / 2, -h / 2)
            //     .arc(0, -h / 2, w / 2, Math.PI, 0)
            //     .lineTo(w / 2, h / 2 - wingH)
            //     .lineTo(w / 2 + wingW, h / 2)
            //     .endFill();


            // actor.graphics.pivot.set(r / 2, h / 2);
            actor.graphics.position.set(x, y);
            actor.body = Bodies.circle(x, y, r);
        }

        function goal(x: number, y: number, r: number, color: number): void {
            const [goalId,] = world.addEntity(Goal);
            const actor = world.addComponent(Actor, goalId);
            const hint = world.addComponent(Hint, goalId);

            // actor.graphics = new Graphics().beginFill(color).drawCircle(0, 0, r);

            const [star] = starShape(r, 0);

            actor.graphics = new Graphics()
                .beginFill(0xff0ff0)
                .drawPolygon(star)
                .endFill();


            // actor.graphics.pivot.set(r / 2, h / 2);
            actor.graphics.position.set(x, y);
            actor.body = Bodies.fromVertices(x, y, [star]);

            const hintStep = (window.innerHeight / 2) * (0.618);
            const top = hintStep + hintStep * (1 - 0.618) * (1 - 0.618);

            hint.graphics = new Graphics()
                .lineStyle(3, 0xffffff)
                .moveTo(hintStep, 0)
                .lineTo(top, 0)
                .lineTo(top - 7, -7)
                .moveTo(top, 0)
                .lineTo(top - 7, 7);

            hint.graphics.visible = false;
        }

        player(0, 0, 16, 0);
        goal(256, 256, 32, 0xf0f000);
    }

    public override onLink(world: World): void {
        const { stage, physics } = world.firstComponent(Application);

        const playerActor = world.getComponent(Actor, world.first([Player]));
        const goalActor = world.getComponent(Actor, world.first([Goal]));
        const actors = world.getComponents(Actor);

        stage.addChild(...actors.map(a => a.graphics));
        Composite.add(physics.world, actors.map(a => a.body));

        const hints = world.getComponents(Hint);

        playerActor.graphics.addChild(...hints.map(h => h.graphics));

        Events.on(physics, 'collisionStart', function(event) {
            for (const pairs of event.pairs) {
                const { bodyA, bodyB } = pairs;
                if (bodyA === playerActor.body || bodyB === playerActor.body) {
                    const anotherBody = bodyA === playerActor.body ? bodyB : bodyA;

                    if (playerActor.body.speed > 2) {
                        const sound = world.addComponent(
                            Sound,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                            anotherBody.plugin.entityId
                        );

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        sound.name =
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                            anotherBody.plugin.soundName;

                        return;
                    }
                }

                if ((bodyA === playerActor.body && bodyB === goalActor.body) || bodyB === playerActor.body && bodyA === goalActor.body) {
                    const level = world.firstComponent(Level);
                    level.finished = true;
                }
            }
        });
    }

    public override onInput(world: World, delta: number): void {
        const controller = world.getComponent(Controller, world.first([Controller]));
        const camera = world.firstComponent(Camera);
        const { stage } = world.firstComponent(Application);

        const playerId = world.first([Player]);
        const { body } = world.getComponent(Actor, playerId);

        const dir = Vector.create(0, 0);

        if (controller.pointerPressed) {
            const worldX = controller.pointer.x - stage.position.x + camera.position.x;
            const worldY = controller.pointer.y - stage.position.y + camera.position.y;
            const pointerDir = Vector.normalise(Vector.sub(Vector.create(worldX, worldY), body.position));

            Vector.add(dir, pointerDir, dir);
        }

        if (controller.topPressed && !controller.bottomPressed) {
            dir.y -= 1;
        }
        if (controller.rightPressed && !controller.leftPressed) {
            dir.x += 1;
        }
        if (controller.bottomPressed && !controller.topPressed) {
            dir.y += 1;
        }
        if (controller.leftPressed && !controller.rightPressed) {
            dir.x -= 1;
        }

        if (dir.x !== 0 || dir.y !== 0) {
            Body.applyForce(body, body.position, Vector.mult(Vector.normalise(dir), delta * 0.00005));
        }
    }
}


console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);
