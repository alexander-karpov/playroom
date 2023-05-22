import { type Vector3 } from '@babylonjs/core/Maths/math.vector';
import { type PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// TODO: заменить когда метод появится
// https://github.com/BabylonJS/Babylon.js/issues/13795
export function raycast2(
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
