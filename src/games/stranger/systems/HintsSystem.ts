import { System, type World } from '~/ecs';
import { Vector } from 'matter-js';

export class HintsSystem extends System {
    // public override onOutput(world: World, delta: number): void {
    //     const { renderer } = world.firstComponent(Application);
    //     const entities = world.select([Hint, Actor]);
    //     for (const entityId of entities) {
    //         const hint = world.getComponent(Hint, entityId);
    //         const actor = world.getComponent(Actor, entityId);
    //         const distance = Vector.magnitude(
    //             Vector.sub(hint.graphics.parent.position, actor.graphics.position)
    //         );
    //         if (distance > renderer.height) {
    //             hint.graphics.rotation = Vector.angle(
    //                 hint.graphics.parent.position,
    //                 actor.graphics.position
    //             ) - hint.graphics.parent.rotation;
    //             hint.graphics.visible = true;
    //         } else {
    //             hint.graphics.visible = false;
    //         }
    //     }
    // }
}
