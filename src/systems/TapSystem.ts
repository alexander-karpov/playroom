import { type World } from '~/ecs';
import { DebugableSystem } from './DebugableSystem';
import { type Scene } from '@babylonjs/core/scene';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { raycast2 } from '~/utils/raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { FilterCategory, getCategoryMask, getCollideMaskFor } from '~/FilterCategory';
import { type TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { readEntityId } from '~/utils/entityHelpers';
import { LongTap } from '~/components/LongTap';
import { Tap } from '~/components/Tap';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { type EventState } from '@babylonjs/core/Misc/observable';
import { type IPointerEvent } from '@babylonjs/core/Events/deviceInputEvents';
import { ComponentClass } from '~/ecs/ComponentClass';
import { PrivilegedTapListener } from '~/components/PrivilegedTapListener';

const raycastEnd = new Vector3();
const ray = new Ray(Vector3.Zero(), Vector3.Zero());
const raycastAndTap_result = new PhysicsRaycastResult();
const pointerMoveDelta = new Vector2();

export class TapSystem extends DebugableSystem {
    private readonly touchDistance = 100;

    private readonly pointerDownPosition = new Vector2();
    private readonly tapTimeLimit = 500;
    private readonly tapMaximalMoveSq = 2 * 2;
    private longTapTimer?: NodeJS.Timeout;
    private currentPointerId = 0;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly camera: TargetCamera,
        private readonly havok: HavokPlugin
    ) {
        super();

        // TODO: Отписываться если камера перестала быть активной
        this.scene.onPointerObservable.add(
            this.onPointerEvent.bind(this),
            PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP
        );
    }

    private onPointerEvent(p: PointerInfo, state: EventState) {
        const { type } = p;
        const event = p.event as IPointerEvent;
        const pointerId = event.pointerId;

        if (type === PointerEventTypes.POINTERDOWN) {
            this.currentPointerId = pointerId;
            this.pointerDownPosition.set(event.offsetX, event.offsetY);

            this.longTapTimer = setTimeout(
                (savedPointerId) => {
                    if (this.currentPointerId === savedPointerId && this.isTapDistance()) {
                        this.currentPointerId = 0;

                        this.onLongTap(p);
                    }
                },
                this.tapTimeLimit,
                pointerId
            );
        }

        if (type === PointerEventTypes.POINTERUP) {
            clearTimeout(this.longTapTimer);

            if (pointerId !== this.currentPointerId) {
                return;
            }

            if (!this.isTapDistance()) {
                return;
            }

            this.onTap(p);
        }
    }

    private isTapDistance() {
        return (
            pointerMoveDelta
                .set(this.scene.pointerX, this.scene.pointerY)
                .subtractInPlace(this.pointerDownPosition)
                .lengthSquared() <= this.tapMaximalMoveSq
        );
    }

    private onTap(p: PointerInfo) {
        for (const lisenerId of this.world.select([PrivilegedTapListener])) {
            this.fireTap(lisenerId, Tap, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly);

            return;
        }

        this.raycastAndTap(p, Tap);
    }

    private onLongTap(p: PointerInfo) {
        this.raycastAndTap(p, LongTap);
    }

    private raycastAndTap(p: PointerInfo, component: typeof Tap | typeof LongTap) {
        const result = raycastAndTap_result;

        this.raycastThingToRef(p, result);

        if (!result.hasHit) {
            return;
        }

        const node = result.body?.transformNode;

        if (!node) {
            return;
        }

        const entityId = readEntityId(node);

        if (entityId == null) {
            return;
        }

        this.fireTap(entityId, component, result.hitPointWorld, result.hitNormalWorld);
    }

    private fireTap(
        entityId: number,
        component: typeof Tap | typeof LongTap,
        point: Vector3,
        normal: Vector3
    ) {
        const touched = this.world.attach(entityId, component);

        touched.point.copyFrom(point);
        touched.normal.copyFrom(normal);

        this.world.detach(entityId, component);
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
