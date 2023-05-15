import { type World } from '~/ecs';
import type { Scene } from '@babylonjs/core/scene';
import { ShooterSystem } from './ShooterSystem';
import type { GUI } from 'lil-gui';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { type Camera } from '@babylonjs/core/Cameras/camera';
import { nameof } from '~/utils/nameof';

export class DebugCameraSystem extends ShooterSystem {
    private readonly debugCamera: ArcRotateCamera;
    private gameCamera: Camera | null = null;

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        this.debugCamera = new ArcRotateCamera(
            'debugCamera',
            0,
            Math.PI / 2,
            5,
            Vector3.Zero(),
            this.scene
        );

        this.debugCamera.attachControl(this.scene.getEngine().getRenderingCanvas());
        this.debugCamera.radius = 32;
        this.debugCamera.lowerRadiusLimit = 2;
        this.debugCamera.upperRadiusLimit = 64;
    }

    public override onDebug(gui: GUI): void {
        const host = {
            debugCameraOn: false,
        };

        gui.add(host, nameof<typeof host>('debugCameraOn'))
            .name('Debug camera')
            .onChange((value: boolean) => {
                if (value) {
                    this.gameCamera = this.scene.activeCamera;
                    this.scene.activeCamera = this.debugCamera;
                } else {
                    this.scene.activeCamera = this.gameCamera;
                }
            });
    }
}
