import { type TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BaseCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/BaseCameraPointersInput';
import { type PointerTouch } from '@babylonjs/core/Events/pointerEvents';
import { type Nullable } from '@babylonjs/core/types';
import { type IPointerEvent } from '@babylonjs/core/Events/deviceInputEvents';
import { Epsilon } from '@babylonjs/core/Maths/math.constants';

const delta = new Vector2();
const localDirection = new Vector3();

export class ShooterCameraPointersInput extends BaseCameraPointersInput {
    public angularSensibilityX = 0.0128;
    public angularSensibilityY = 0.0128;
    public movementSpeed = 0.2;

    private halfScreenWidth: number = 0;
    private screenHeight: number = 0;
    private readonly titlHeightPart = 8;

    private rotationPointerId = -1;
    private readonly previousRotationPoint = new Vector2(0, 0);
    private readonly rotationPoint = new Vector2(0, 0);

    private movementPointerId = -1;
    private readonly startMovementPoint = new Vector2(0, 0);
    private readonly previousMovementPoint = new Vector2(0, 0);
    private readonly movementPoint = new Vector2(0, 0);
    private readonly movement = new Vector3();

    public constructor(public override camera: TargetCamera) {
        super();

        const onResize = () => {
            this.halfScreenWidth = window.innerWidth / 2;
            this.screenHeight = window.innerHeight;
        };

        onResize();
        window.addEventListener('resize', onResize);
    }

    public checkInputs() {
        if (this.rotationPointerId !== -1) {
            this.applyRotation();
        }

        if (this.movementPointerId !== -1) {
            this.applyMovement();
        }
    }

    public override onTouch(point: Nullable<PointerTouch>, offsetX: number, offsetY: number): void {
        if (!point) {
            return;
        }

        if (point.pointerId === this.rotationPointerId) {
            this.rotationPoint.set(point.x, point.y);
        }

        if (point.pointerId === this.movementPointerId) {
            this.movementPoint.set(point.x, point.y);
        }
    }

    public override onMultiTouch(
        _pointA: Nullable<PointerTouch>,
        _pointB: Nullable<PointerTouch>,
        previousPinchSquaredDistance: number,
        pinchSquaredDistance: number,
        previousMultiTouchPanPosition: Nullable<PointerTouch>,
        multiTouchPanPosition: Nullable<PointerTouch>
    ): void {
        this.onTouch(_pointA, 0, 0);
        this.onTouch(_pointB, 0, 0);
    }

    public override onButtonDown(evt: IPointerEvent): void {
        const isRotationEvent = evt.clientX > this.halfScreenWidth;

        if (isRotationEvent) {
            this.rotationPointerId = evt.pointerId;

            this.rotationPoint.set(evt.x, evt.y);
            this.previousRotationPoint.set(evt.x, evt.y);
        } else {
            this.movementPointerId = evt.pointerId;

            this.startMovementPoint.set(evt.x, evt.y);
            this.previousMovementPoint.set(evt.x, evt.y);
            this.movementPoint.set(evt.x, evt.y);
            this.movement.set(0, 0, 0);
        }
    }

    public override onButtonUp(evt: IPointerEvent): void {
        if (this.rotationPointerId === evt.pointerId) {
            this.rotationPointerId = -1;
        }

        if (this.movementPointerId === evt.pointerId) {
            this.movementPointerId = -1;
        }
    }

    private applyRotation() {
        delta.copyFrom(this.rotationPoint).subtractInPlace(this.previousRotationPoint);

        if (delta.lengthSquared() > Epsilon) {
            delta.x *= this.angularSensibilityX;
            delta.y *= this.angularSensibilityY;

            this.camera.cameraRotation.set(delta.y, delta.x);

            this.previousRotationPoint.copyFrom(this.rotationPoint);
        }
    }

    private applyMovement() {
        if (!this.movementPoint.equals(this.previousMovementPoint)) {
            this.updateMovement();
            this.previousMovementPoint.copyFrom(this.movementPoint);
        }

        this.camera.cameraDirection
            .copyFrom(this.movement)
            .scale(this.camera.getEngine().getDeltaTime());
    }

    private updateMovement() {
        localDirection.set(
            this.movementPoint.x - this.startMovementPoint.x,
            0,
            -(this.movementPoint.y - this.startMovementPoint.y)
        );

        const tiltRadius = this.screenHeight / this.titlHeightPart;
        const tilt = Math.min(1, localDirection.length() / tiltRadius);

        localDirection.normalize();

        this.camera.getViewMatrix().invertToRef(this.camera._cameraTransformMatrix);

        Vector3.TransformNormalToRef(
            localDirection,
            this.camera._cameraTransformMatrix,
            this.movement
        );

        this.movement.y = 0;
        this.movement.normalize();
        this.movement.scaleInPlace(this.movementSpeed * tilt);
    }
}
