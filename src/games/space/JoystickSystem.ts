import * as THREE from 'three';
import type { World } from '~/ecs';
import { System } from '~/ecs';
import { Joystick } from './components/Joystick';

export class JoystickSystem extends System {
    public constructor(
        private readonly world: World,
        /**
         * Как сильно джойстик отклоняется от центра
         */
        private readonly maxRadius: number,
        private readonly renderer: THREE.WebGLRenderer
    ) {
        super();

        this.subscribeToPointerEvents(world);
    }

    private subscribeToPointerEvents(world: World) {
        function onStart(ev: PointerEvent) {
            const [, joystick] = world.newEntity(Joystick);

            joystick.pointerId = ev.pointerId;
            joystick.tilt = 0;

            joystick.start ??= new THREE.Vector2();
            joystick.start.set(ev.x, ev.y);

            joystick.current ??= new THREE.Vector2();
            joystick.current.set(0, 0);

            joystick.direction ??= new THREE.Vector2();
            joystick.direction.set(0, 0);
        }

        const onMove = (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.get(id, Joystick);

                if (joystick.pointerId === ev.pointerId) {
                    this.changeMovingJoystickState(joystick, ev.x, ev.y);

                    break;
                }
            }
        };

        const onEnd = (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.get(id, Joystick);

                if (joystick.pointerId === ev.pointerId) {
                    world.detach(id, Joystick);
                    break;
                }
            }
        };

        this.renderer.domElement.addEventListener('pointerdown', onStart);

        this.renderer.domElement.addEventListener('pointermove', onMove);

        this.renderer.domElement.addEventListener('pointerup', onEnd);
        this.renderer.domElement.addEventListener('pointerleave', onEnd);
        this.renderer.domElement.addEventListener('pointerout', onEnd);
        this.renderer.domElement.addEventListener('pointercancel', onEnd);
    }

    private changeMovingJoystickState(joystick: Joystick, x: number, y: number) {
        joystick.current.set(x, y);

        joystick.direction.set(x, y).sub(joystick.start);
        const lengthSq = joystick.direction.lengthSq();
        joystick.direction.normalize();

        joystick.tilt = lengthSq / (this.maxRadius * this.maxRadius);

        if (joystick.tilt > 1) {
            joystick.tilt = 1;

            // Подтягиваем точку start ближе к курсору/пульцуъ
            joystick.start.set(joystick.current.x, joystick.current.y);
            joystick.start.addScaledVector(joystick.direction, -this.maxRadius);
        }
    }
}
