import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { CameraInputsManager } from '@babylonjs/core/Cameras/cameraInputsManager';
import { FirstPersonCameraPointersInput } from './FirstPersonCameraPointersInput';
import { type Vector3 } from '@babylonjs/core/Maths/math.vector';
import { type Scene } from '@babylonjs/core/scene';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';

export class FirstPersonCamera extends TargetCamera {
    public constructor(position: Vector3, scene: Scene, havok: Promise<HavokPlugin>) {
        super('FirstPersonCamera', position, scene);

        this.inputs = new CameraInputsManager(this);

        this.inputs.add(new FirstPersonCameraPointersInput(this, havok));

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
