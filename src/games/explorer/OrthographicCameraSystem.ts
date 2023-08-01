import { engine } from '~/game';
import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { DebugableSystem } from '~/systems/DebugableSystem';
import type GUI from 'lil-gui';
import { nameof } from '~/utils/nameof';

export class OrthographicCameraSystem extends DebugableSystem {
    public constructor(private readonly camera: TargetCamera) {
        super();

        // camera.mode = TargetCamera.ORTHOGRAPHIC_CAMERA;
        camera.position.x = 50;
        camera.position.y = 50;
        camera.position.z = -50;

        /**
         * @see https://www.kodeco.com/13582558-how-to-make-a-game-like-monument-valley
         */
        camera.rotation.x = 0.6154729074;
        camera.rotation.y = -0.7853981634;

        this.zoom(4);
    }

    public override onDebug(gui: GUI): void {
        const host = {
            positionX: this.camera.position.x,
            positionY: this.camera.position.y,
            positionZ: this.camera.position.z,
            zoom: 4,
            rotationX: this.camera.rotation.x,
            rotationY: this.camera.rotation.y,
        };

        gui.add(host, nameof<typeof host>('positionX'))
            .name('position x')
            .onChange((value: number) => {
                this.camera.position.x = value;
            });

        gui.add(host, nameof<typeof host>('positionY'))
            .name('position y')
            .onChange((value: number) => {
                this.camera.position.y = value;
            });

        gui.add(host, nameof<typeof host>('positionZ'))
            .name('position z')
            .onChange((value: number) => {
                this.camera.position.z = value;
            });

        gui.add(host, nameof<typeof host>('zoom'))
            .name('zoom')
            .onChange((value: number) => {
                this.zoom(value);
            });

        gui.add(host, nameof<typeof host>('rotationX'), 0, Math.PI, 0.001)
            .name('rotation x')
            .onChange((value: number) => {
                this.camera.rotation.x = value;
            });

        gui.add(host, nameof<typeof host>('rotationY'), 0, Math.PI, 0.001)
            .name('rotation y')
            .onChange((value: number) => {
                this.camera.rotation.y = value;
            });
    }

    private zoom(zoom: number) {
        const r = engine.getScreenAspectRatio();
        const z = Math.pow(2, zoom);

        const halfWidth = (z * r) / 2;
        const halfHeight = z / 2;

        this.camera.orthoTop = halfHeight;
        this.camera.orthoBottom = -halfHeight;
        this.camera.orthoLeft = -halfWidth;
        this.camera.orthoRight = halfWidth;
    }
}
