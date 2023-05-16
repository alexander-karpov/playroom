import { type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/games/space/components';
import { Body, Composite, type Engine } from 'matter-js';

export class ObjectPoolHelper {
    public static activate(world: World, engine: Engine, id: number) {
        if (!world.has(Active, id)) {
            world.attach(id, Active);
        }

        const { object3d } = world.get(id, GameObject);
        const { body } = world.get(id, RigibBody);

        object3d.visible = true;
        Body.setStatic(body, false);
        Composite.add(engine.world, body);
    }

    public static deactivate(world: World, engine: Engine, id: number) {
        if (world.has(Active, id)) {
            world.detach(id, Active);
        }

        const { object3d } = world.get(id, GameObject);
        const { body } = world.get(id, RigibBody);

        Composite.remove(engine.world, body);
        Body.setStatic(body, true);
        object3d.visible = false;
    }
}
