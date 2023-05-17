import { type World } from '~/ecs';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { Character } from './Character';
import { RigidBody } from '../RigidBody';
import { Bits } from '~/utils/Bits';
import { Epsilon } from '@babylonjs/core/Maths/math.constants';
import { FilterCategory } from '../FilterCategory';
import { ShooterSystem } from '../ShooterSystem';
import { raycast2 } from '../raycast2';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

const GRAVITY = 9.8; //30;
const groundProbe = new Vector3();
const velocity = new Vector3();

export class CharacterControllerSystem extends ShooterSystem {
    private readonly raycastResult = new PhysicsRaycastResult();

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly physEngine: HavokPlugin
    ) {
        super();
    }

    public override onUpdate(world: World, deltaSec: number): void {
        for (const id of this.world.select([Character, RigidBody])) {
            const character = this.world.get(id, Character);
            const { capsuleHeight, direction, speed } = character;
            const { body } = this.world.get(id, RigidBody);

            const footY = body.transformNode.position.y - capsuleHeight / 2;
            groundProbe.copyFrom(body.transformNode.position);
            groundProbe.y = footY - 0.1;

            // TODO: заменить когда метод появится
            // https://github.com/BabylonJS/Babylon.js/issues/13795
            raycast2(
                this.physEngine,
                body.transformNode.position,
                groundProbe,
                this.raycastResult,
                Bits.bit(FilterCategory.Character),
                Bits.bit(FilterCategory.Ground)
            );

            const isGrounded = this.raycastResult.hasHit;

            if (!isGrounded) {
                character.verticalVelocity -= GRAVITY * deltaSec;
            } else {
                character.verticalVelocity = 0;

                if (Math.abs(this.raycastResult.hitPointWorld.y - footY) > Epsilon) {
                    // Точное приземление
                    body.transformNode.position.y =
                        this.raycastResult.hitPointWorld.y + capsuleHeight / 2;
                    body.disablePreStep = false;

                    this.scene.onAfterRenderObservable.addOnce(() => {
                        body.disablePreStep = true;
                    });
                }
            }

            velocity.copyFrom(direction).scaleInPlace(speed);
            velocity.y = character.verticalVelocity;
            body.setLinearVelocity(velocity);
        }
    }
}
