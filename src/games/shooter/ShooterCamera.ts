import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { CameraInputsManager } from '@babylonjs/core/Cameras/cameraInputsManager';
import { ShooterCameraPointersInput } from './ShooterCameraPointersInput';

export class ShooterCamera extends TargetCamera {
    private readonly input = new ShooterCameraPointersInput(this);

    public constructor(...args: unknown[]) {
        // @ts-expect-error
        super(...args);

        this.inputs = new CameraInputsManager(this);
        this.inputs.add(this.input);

        this.minZ = 0;
        this.inertia = 0;
    }

    public override attachControl(ignored: any, noPreventDefault?: boolean) {
        this.inputs.attachElement(false);
    }

    public override detachControl(): void {
        this.inputs.detachElement();
    }

    public override _checkInputs(): void {
        this.inputs.checkInputs();

        super._checkInputs();
    }
}
