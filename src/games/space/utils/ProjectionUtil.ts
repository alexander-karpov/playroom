import * as THREE from 'three';
import type { ScreenSizeSource } from '~/games/space/utils/ScreenSizeSource';

/**
 * Screen
 * ------
 * (0,0) ------------- (640,0)
 *   |                   |
 *   |                   |
 *   |                   |
 *   |                   |
 * (0,480) ----------- (640,480)
 *
 * View
 * -----
 * (-1,1) ------------ (1,1)
 *   |                   |
 *   |                   |
 *   |       (0,0)       |
 *   |                   |
 *   |                   |
 * (-1,-1) ----------- (1,-1)
 *
 * World
 * -----
 * (-x,y) ------------ (x,y)
 *   |                   |
 *   |                   |
 *   |       (0,0)       |
 *   |                   |
 *   |                   |
 * (-x,-x) ----------- (x,-y)
 *
 * Это расположение 3D объектов на сцене
 * относительно друг друга
 */
export class ProjectionUtil {
    private readonly raycaster = new THREE.Raycaster();
    private readonly screenPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1));
    private readonly tempVec2 = new THREE.Vector2();

    public constructor(
        private readonly screenSize: ScreenSizeSource,
        private readonly camera: THREE.Camera
    ) {}

    public viewToWorld(x: number, y: number, depth: number, target: THREE.Vector3): void {
        this.tempVec2.set(x, y);

        this.screenPlane.set(this.screenPlane.normal, depth);

        this.raycaster.setFromCamera(this.tempVec2, this.camera);
        this.raycaster.ray.intersectPlane(this.screenPlane, target);
    }

    public screenToView(x: number, y: number, target: THREE.Vector2): void {
        target.x = (x / this.screenSize.width) * 2 - 1;
        target.y = -(y / this.screenSize.height) * 2 + 1;
    }

    public screenToWorld(x: number, y: number, depth: number, target: THREE.Vector3): void {
        this.screenToView(x, y, this.tempVec2);

        this.viewToWorld(this.tempVec2.x, this.tempVec2.y, depth, target);
    }
}
