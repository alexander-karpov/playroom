import { type World } from '~/ecs';
import { TmpVectors, type Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { Character } from './Character';
import { RigidBody } from './RigidBody';
import { Bits } from '~/utils/Bits';
import { Epsilon } from '@babylonjs/core/Maths/math.constants';
import { FilterCategory } from './FilterCategory';
import { ShooterSystem } from './ShooterSystem';

const GRAVITY = 9.8; //30;

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

            const groundProbe = TmpVectors.Vector3[0];
            const velocity = TmpVectors.Vector3[1];

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

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// TODO: заменить когда метод появится
// https://github.com/BabylonJS/Babylon.js/issues/13795
function raycast2(
    engine: HavokPlugin,
    from: Vector3,
    to: Vector3,
    result: PhysicsRaycastResult,
    queryMembership: number,
    queryCollideWith: number
) {
    // TODO: исправлено в новой версии
    result.reset();

    const query = [
        // @ts-expect-error
        engine._bVecToV3(from),
        // @ts-expect-error
        engine._bVecToV3(to),
        [queryMembership, queryCollideWith],
    ];
    engine._hknp.HP_World_CastRayWithCollector(
        engine.world,
        // @ts-expect-error
        engine._queryCollector,
        query
    );

    if (
        engine._hknp.HP_QueryCollector_GetNumHits(
            // @ts-expect-error
            engine._queryCollector
        )[1] > 0
    ) {
        const hitData = engine._hknp.HP_QueryCollector_GetCastRayResult(
            // @ts-expect-error
            engine._queryCollector,
            0
        )[1];

        const hitPos = hitData[1][3];
        const hitNormal = hitData[1][4];
        result.setHitData(
            { x: hitNormal[0], y: hitNormal[1], z: hitNormal[2] },
            { x: hitPos[0], y: hitPos[1], z: hitPos[2] }
        );
        result.calculateHitDistance();
        // @ts-expect-error
        const hitBody = engine._bodies.get(hitData[1][0][0]);
        result.body = hitBody?.body;
        result.bodyIndex = hitBody?.index;
    }
}
