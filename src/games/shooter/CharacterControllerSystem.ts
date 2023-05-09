import { System, type World } from '~/ecs';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { type Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import HavokPhysics from '@babylonjs/havok';
import { type PhysicsEngine } from '@babylonjs/core/Physics/v2/physicsEngine';
import { type Nullable } from '@babylonjs/core/types';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { Character } from './Character';
import { RigidBody } from './RigidBody';
import { Bits } from '~/utils/Bits';

const GRAVITY = 9.8; //30;

export class CharacterControllerSystem extends System {
    private readonly engine: Engine;
    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly groundProbe = new Vector3();
    private readonly velocity = new Vector3();

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly physEngine: HavokPlugin
    ) {
        super();

        this.engine = this.scene.getEngine();
    }

    public override onUpdate(world: World, deltaSec: number): void {
        const fixingGroundingDiff = 0.02;
        const damping = Math.exp(-4 * this.engine.getTimeStep()) - 1;

        for (const id of this.world.select([Character, RigidBody])) {
            const { capsuleHeight, direction, speed } = this.world.get(id, Character);
            const { body } = this.world.get(id, RigidBody);

            this.groundProbe.copyFrom(body.transformNode.position);
            this.groundProbe.y -= capsuleHeight / 2 + 0.1;

            raycast2(
                this.physEngine,
                body.transformNode.position,
                this.groundProbe,
                this.raycastResult,
                Bits.bit(2),
                Bits.bit(1)
            );

            const isGrounded = this.raycastResult.hasHit;

            body.getLinearVelocityToRef(this.velocity);
            this.velocity.x = direction.x * speed;
            this.velocity.z = direction.z * speed;

            if (!isGrounded) {
                this.velocity.y -= GRAVITY * deltaSec;
            } else {
                const yFeet = body.transformNode.position.y - capsuleHeight / 2;
                const yDiff = this.raycastResult.hitPointWorld.y - yFeet;

                if (Math.abs(yDiff) > fixingGroundingDiff) {
                    body.disablePreStep = false;

                    body.transformNode.position.y += yDiff * Math.min(1, deltaSec * 5);

                    this.scene.onAfterRenderObservable.addOnce(() => {
                        // Turn disablePreStep on again for maximum performance
                        body.disablePreStep = true;
                    });
                }

                this.velocity.y = 0;
            }

            body.setLinearVelocity(this.velocity);
        }
    }
}

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

function raycast2(
    engine: HavokPlugin,
    from: Vector3,
    to: Vector3,
    result: PhysicsRaycastResult,
    queryMembership: number,
    queryCollideWith: number
) {
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
