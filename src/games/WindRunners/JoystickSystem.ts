import * as THREE from 'three';
import type { World } from '~/ecs';
import { System } from '~/ecs';
import { Joystick } from './Joystick';

export class JoystickSystem extends System {
    public constructor(
        /**
         * Как сильно джойстик отклоняется от центра
         */
        private readonly maxRadius: number,
        private readonly renderer: THREE.WebGLRenderer
    ) {
        super();
    }

    public override onCreate(world: World): void {
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

            subscribeOnPointerMoveAndEnd();
        }

        const onMove = (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.get(Joystick, id);

                if (joystick.pointerId === ev.pointerId) {
                    this.changeMovingJoystickState(joystick, ev.x, ev.y);

                    break;
                }
            }
        };

        const onEnd = (ev: PointerEvent) => {
            for (const id of world.select([Joystick])) {
                const joystick = world.get(Joystick, id);

                if (joystick.pointerId === ev.pointerId) {
                    world.detach(Joystick, id);
                    break;
                }
            }

            unsubscribeOnPointerMoveAndEnd();
        };

        this.renderer.domElement.addEventListener('pointerdown', onStart);

        const subscribeOnPointerMoveAndEnd = () => {
            this.renderer.domElement.addEventListener('pointermove', onMove);

            this.renderer.domElement.addEventListener('pointerup', onEnd);
            this.renderer.domElement.addEventListener('pointerleave', onEnd);
            this.renderer.domElement.addEventListener('pointerout', onEnd);
            this.renderer.domElement.addEventListener('pointercancel', onEnd);
        };

        const unsubscribeOnPointerMoveAndEnd = () => {
            this.renderer.domElement.removeEventListener('pointermove', onMove);

            this.renderer.domElement.removeEventListener('pointerup', onEnd);
            this.renderer.domElement.removeEventListener('pointerleave', onEnd);
            this.renderer.domElement.removeEventListener('pointerout', onEnd);
            this.renderer.domElement.removeEventListener('pointercancel', onEnd);
        };
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
