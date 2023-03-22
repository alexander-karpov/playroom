import { System, type World } from '../ecs';
import { Controller } from '../components';
import { Vector } from 'matter-js';

export class UserInputSystem extends System {
    public override onCreate(world: World): void {
        const [, pointer] = world.addEntity(Controller);

        pointer.pointer = Vector.create(0, 0);
        pointer.pointerPressed = false;

        pointer.topPressed = false;
        pointer.rightPressed = false;
        pointer.bottomPressed = false;
        pointer.leftPressed = false;
    }

    public override onLink(world: World): void {
        const controller = world.firstComponent(Controller);
        const canvas = document.getElementsByTagName('canvas')[0]!;

        canvas.addEventListener('mousemove', (ev: MouseEvent) => {
            controller.pointer.x = ev.x;
            controller.pointer.y = ev.y;
        });

        canvas.addEventListener('mousedown', (_ev: MouseEvent) => {
            controller.pointerPressed = true;
        });

        canvas.addEventListener('mouseup', (_ev: MouseEvent) => {
            controller.pointerPressed = false;
        });

        window.addEventListener('keydown', function(ev): void {
            switch (ev.code) {
            case 'KeyW':
            case 'ArrowUp':
                controller.topPressed = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                controller.rightPressed = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                controller.bottomPressed = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                controller.leftPressed = true;
                break;
            }
        });

        window.addEventListener('keyup', function(ev): void {
            switch (ev.code) {
            case 'KeyW':
            case 'ArrowUp':
                controller.topPressed = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                controller.rightPressed = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                controller.bottomPressed = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                controller.leftPressed = false;
                break;
            }
        });
    }
}
