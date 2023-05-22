import { type World } from '~/ecs';
import { DebugableSystem } from './DebugableSystem';
import { type Scene } from '@babylonjs/core/scene';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { raycast2 } from '../utils/raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { FilterCategory, getCategoryMask, getCollideMaskFor } from '../FilterCategory';
import { type TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { readEntityId } from '~/utils/entityHelpers';
import { Touched } from '~/components/Touched';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';

const raycastEnd = new Vector3();
const ray = new Ray(Vector3.Zero(), Vector3.Zero());
const raycastResult = new PhysicsRaycastResult();

export class TouchSystem extends DebugableSystem {
    private readonly touchDistance = 100;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly camera: TargetCamera,
        private readonly havok: HavokPlugin
    ) {
        super();

        // TODO: Отписываться если камера перестала быть активной
        this.scene._inputManager._addCameraPointerObserver(
            this.onTap.bind(this),
            PointerEventTypes.POINTERTAP
        );
    }

    private onTap(p: PointerInfo) {
        this.raycastThingToRef(p, raycastResult);

        if (raycastResult.hasHit) {
            const node = raycastResult.body?.transformNode;

            if (node) {
                const entityId = readEntityId(node);

                if (entityId != null) {
                    const touched = this.world.attach(entityId, Touched);

                    touched.point.copyFrom(raycastResult.hitPointWorld);
                    touched.normal.copyFrom(raycastResult.hitNormalWorld);

                    this.world.detach(entityId, Touched);
                }
            }
        }
    }

    private raycastThingToRef(p: PointerInfo, result: PhysicsRaycastResult) {
        this.scene.createPickingRayToRef(p.event.offsetX, p.event.offsetY, null, ray, this.camera);

        raycastEnd.copyFrom(ray.direction).scaleInPlace(this.touchDistance).addInPlace(ray.origin);

        raycast2(
            this.havok,
            ray.origin,
            raycastEnd,
            result,
            getCategoryMask(FilterCategory.Thing),
            getCollideMaskFor(FilterCategory.Thing)
        );
    }
}
