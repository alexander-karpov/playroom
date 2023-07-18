import { type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Scene } from '@babylonjs/core/scene';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DebugableSystem } from './DebugableSystem';

export class EnvironmentSystem extends DebugableSystem {
    private readonly cameraClipDistance = 30;
    private readonly fogMode = Scene.FOGMODE_EXP2;
    private readonly fogColor = new Color3(0.7, 0.7, 0.67);

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        this.scene.clearColor = Color4.FromColor3(this.fogColor);
        this.scene.fogMode = Scene.FOGMODE_EXP2;
        this.scene.fogColor = this.fogColor;

        if (this.scene.activeCamera) {
            this.scene.activeCamera.maxZ = this.cameraClipDistance;
        }
    }

    public override onDebug() {
        this.scene.onActiveCameraChanged.add(() => {
            const cameraName = this.scene.activeCamera?.name;

            if (cameraName === 'debugCamera') {
                this.scene.fogMode = Scene.FOGMODE_NONE;
            } else {
                this.scene.fogMode = this.fogMode;
            }
        });
    }
}
