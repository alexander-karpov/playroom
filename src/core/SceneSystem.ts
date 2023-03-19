import { System, type World } from '../ecs';
import { Application, Actor, Pointer, Player, Camera, Goal, Hint, Rock, Level } from '../components';
import { Graphics, type IPointData } from 'pixi.js';
import { Events, Bodies, Composite, Body, Vector } from 'matter-js';


export class SceneSystem extends System {
    public override onCreate(world: World): void {
        function player(x: number, y: number, r: number, color: number): void {
            const [playerId,] = world.addEntity(Player);
            const actor = world.addComponent(Actor, playerId);

            // const texture = Texture.from('exo.png');
            // .beginTextureFill({
            //     texture,

            // })
            actor.graphics = new Graphics()
                .beginFill(0)
                .drawCircle(0, 0, r);
            // actor.graphics.pivot.set(r / 2, h / 2);
            actor.graphics.position.set(x, y);
            actor.body = Bodies.circle(x, y, r);
        }

        function goal(x: number, y: number, r: number, color: number): void {
            const [goalId,] = world.addEntity(Goal);
            const actor = world.addComponent(Actor, goalId);
            const hint = world.addComponent(Hint, goalId);

            // actor.graphics = new Graphics().beginFill(color).drawCircle(0, 0, r);

            const starEnd = Vector.create(0, -r);
            const starHole = Vector.rotate(Vector.create(0, -r * 0.618), (Math.PI / 5));

            const star: IPointData[] = [];

            for (let i = 0; i < 5; i++) {
                star.push(
                    Vector.rotate(starEnd, (Math.PI * 2 / 5) * i)
                );

                star.push(
                    Vector.rotate(starHole, (Math.PI * 2 / 5) * i)
                );
            }

            actor.graphics = new Graphics()
                .beginFill(0xff0ff0)
                .drawPolygon(star);


            // actor.graphics.pivot.set(r / 2, h / 2);
            actor.graphics.position.set(x, y);
            actor.body = Bodies.fromVertices(x, y, [star]);

            const hintStep = (window.innerHeight / 2) * (0.618);
            const top = hintStep + hintStep * (1 - 0.618);

            hint.graphics = new Graphics()
                .lineStyle(3, 0x000000)
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
            for (const { bodyA, bodyB } of event.pairs) {
                if ((bodyA === playerActor.body && bodyB === goalActor.body) || bodyB === playerActor.body && bodyA === goalActor.body) {
                    const level = world.firstComponent(Level);
                    level.finished = true;
                }
            }
        });
    }

    public override onInput(world: World, delta: number): void {
        const pointer = world.getComponent(Pointer, world.first([Pointer]));
        const camera = world.firstComponent(Camera);
        const { stage } = world.firstComponent(Application);

        const playerId = world.first([Player]);
        const { body } = world.getComponent(Actor, playerId);

        if (pointer.pressed) {
            const worldX = pointer.position.x - stage.position.x + camera.position.x;
            const worldY = pointer.position.y - stage.position.y + camera.position.y;

            const dir = Vector.normalise(Vector.sub(Vector.create(worldX, worldY), body.position));
            Body.applyForce(body, body.position, Vector.mult(dir, delta * 0.00005));
        }
    }
}


console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);