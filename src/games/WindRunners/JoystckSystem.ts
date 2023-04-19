import * as THREE from 'three';
import type { World } from '~/ecs';
import { System } from '~/ecs';
import { Joystick } from './Joystick';

export class JoystickSystem extends System {
    public constructor(
        /**
         * Как сильно джойстик отклоняется от центра
         */
        private readonly amplitude: number,
        private readonly renderer: THREE.WebGLRenderer
    ) {
        super();
    }

    public override onCreate(world: World): void {
        this.renderer.domElement.addEventListener('pointerdown', (ev: PointerEvent) => {
            const [, joystick] = world.addEntity(Joystick);

            joystick.pointerId = ev.pointerId;

            if (!joystick.start) {
                joystick.start = new THREE.Vector2();
            }

            joystick.start.set(ev.x, ev.y);

            if (!joystick.current) {
                joystick.current = new THREE.Vector2();
            }

            joystick.current.set(0, 0);

            if (!joystick.direction) {
                joystick.direction = new THREE.Vector2();
            }

            joystick.direction.set(0, 0);

            joystick.tilt = 0;
        });

        this.renderer.domElement.addEventListener('pointermove', (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.getComponent(Joystick, id);

                if (joystick.pointerId !== ev.pointerId) {
                    continue;
                }

                joystick.current.set(ev.x, ev.y);

                joystick.direction.set(ev.x, ev.y).sub(joystick.start);
                const lengthSq = joystick.direction.lengthSq();
                joystick.direction.normalize();

                joystick.tilt = lengthSq / (this.amplitude * this.amplitude);

                if (joystick.tilt > 1) {
                    joystick.tilt = 1;

                    // Подтягиваем точку start ближе к курсору/пульцуъ
                    joystick.start.set(joystick.current.x, joystick.current.y);
                    joystick.start.addScaledVector(joystick.direction, -this.amplitude);
                }
            }
        });

        this.renderer.domElement.addEventListener('pointerup', (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.getComponent(Joystick, id);

                if (joystick.pointerId !== ev.pointerId) {
                    continue;
                }

                world.deleteComponent(Joystick, id);
            }
        });
    }
}
