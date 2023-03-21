import { System, type World } from '../ecs';
import { Pointer } from '../components';
import { Vector } from 'matter-js';

export class MouseSystem extends System {
    public override onCreate(world: World): void {
        const [, pointer] = world.addEntity(Pointer);

        pointer.position = Vector.create(0, 0);
        pointer.pressed = false;
    }

    public override onLink(world: World): void {
        const pointer = world.firstComponent(Pointer);
        const canvas = document.getElementsByTagName('canvas')[0]!;

        canvas.addEventListener('mousemove', (ev: MouseEvent) => {
            pointer.position.x = ev.x;
            pointer.position.y = ev.y;
        });

        canvas.addEventListener('mousedown', (_ev: MouseEvent) => {
            pointer.pressed = true;
        });

        canvas.addEventListener('mouseup', (_ev: MouseEvent) => {
            pointer.pressed = false;
        });
    }
}
