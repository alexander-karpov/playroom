import { System, type World } from '../ecs';
import { Pointer } from '../components';

export class MouseSystem extends System {
    public override onCreate(world: World): void {
        const [, pointer] = world.addEntity(Pointer);

        pointer.position = { x: 0, y: 0 };
        pointer.pressed = false;
    }

    public override onLink(world: World): void {
        const pointer = world.getComponent(Pointer, world.selectOne([Pointer]));

        window.addEventListener('mousemove', (ev: MouseEvent) => {
            pointer.position.x = ev.x;
            pointer.position.y = ev.y;
        });

        window.addEventListener('mousedown', (_ev: MouseEvent) => {
            pointer.pressed = true;
        });

        window.addEventListener('mouseup', (_ev: MouseEvent) => {
            pointer.pressed = false;
        });
    }
}
