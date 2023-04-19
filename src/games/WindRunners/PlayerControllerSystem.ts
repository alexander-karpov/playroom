import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Player } from './Player';
import { GameObject } from '~/components';
import { Joystick } from './Joystick';
import { Jet } from './Jet';
import { signedAngleBetween } from '../../utils/signedAngleBetween';
import { rotationDirection } from '~/utils/dotBetween';

export class PlayerControllerSystem extends System {
    private readonly worldJoystickDirection = new THREE.Vector3();
    private readonly zDirection = new THREE.Vector3(0, 0, 1);
    private readonly q = new THREE.Quaternion();

    public override onSimulate(world: World, deltaS: number): void {
        for (const joystickId of world.select([Joystick])) {
            const joystick = world.getComponent(Joystick, joystickId);

            if (joystick.tilt === 0) {
                continue;
            }

            this.worldJoystickDirection.set(joystick.direction.x, -joystick.direction.y, 0);

            for (const playerId of world.select([Player, Jet])) {
                const jet = world.getComponent(Jet, playerId);
                // this.q.setFromUnitVectors(jet.direction, this.worldJoystickDirection);
                // jet.direction.applyQuaternion(
                //     new THREE.Quaternion().slerp(this.q, deltaS * joystick.tilt)
                // );

                const rotationDir = rotationDirection(
                    jet.direction,
                    this.worldJoystickDirection,
                    this.zDirection
                );

                const angle = Math.min(
                    jet.direction.angleTo(this.worldJoystickDirection),
                    5 * deltaS
                );

                jet.direction.applyAxisAngle(this.zDirection, angle * Math.sign(rotationDir));
                // jet.direction.set(joystick.direction.x, -joystick.direction.y, 0);

                // console.log(jet.direction.dot(this.worldJoystickDirection));

                // const angleTo = movable.direction.angleTo(this.worldJoystickDirection);

                // movable.direction.applyQuaternion(q);
                // movable.direction.set(, 0);
                // const dir = joystick.direction;
                // const speed = joystick.tilt * 10 * deltaS;
                // const q = new THREE.Quaternion();
                // q.setFromUnitVectors(
                //     new THREE.Vector3(0, 0, 1),
                //     new THREE.Vector3(dir.x, -dir.y, 0)
                // );
                // go.object3d.position.add(new THREE.Vector3(dir.x, -dir.y, 0).multiplyScalar(speed));
                // this.go.object3d.quaternion.rotateTowards(q, deltaS * speed);
            }
        }
    }
}
