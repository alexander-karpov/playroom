import type { World } from '~/ecs';
import { System } from '~/ecs/System';

export class GuiSystem extends System {
    public override onCreate(world: World): void {}
}
