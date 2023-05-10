import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { FreeCameraMouseInput } from '@babylonjs/core/Cameras/Inputs/freeCameraMouseInput';

export class ZonedFreeCameraMouseInput extends FreeCameraMouseInput {
    public override attachControl(noPreventDefault?: boolean | undefined): void {
        super.attachControl(noPreventDefault);

        this.camera.getScene()._inputManager._removeCameraPointerObserver(
            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this._observer
        );

        // @ts-expect-error
        this._observer = this.camera
            .getScene()
            ._inputManager._addCameraPointerObserver(
                this._zonedPointerInput.bind(this),
                PointerEventTypes.POINTERDOWN |
                    PointerEventTypes.POINTERUP |
                    PointerEventTypes.POINTERMOVE
            );
    }

    private _zonedPointerInput(p: PointerInfo) {
        if (
            p.type === PointerEventTypes.POINTERDOWN &&
            (p.event as PointerEvent).pointerType === 'touch' &&
            p.event.clientX < window.innerWidth / 2
        ) {
            return;
        }

        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this._pointerInput(p);
    }
}
