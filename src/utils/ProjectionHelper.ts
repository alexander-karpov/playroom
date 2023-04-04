import * as THREE from 'three';

export class ProjectionHelper {
    private readonly raycaster = new THREE.Raycaster();
    private readonly worldPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1));
    private readonly tempVec2 = new THREE.Vector2();
    private readonly screenHeight: number;
    private readonly screenWidth: number;

    public constructor(renderer: THREE.WebGLRenderer, private readonly camera: THREE.Camera) {
        this.screenWidth = renderer.domElement.width;
        this.screenHeight = renderer.domElement.height;
    }

    public viewToWorld(x: number, y: number, target: THREE.Vector3): void {
        this.tempVec2.set(x, y);

        this.raycaster.setFromCamera(this.tempVec2, this.camera);
        this.raycaster.ray.intersectPlane(this.worldPlane, target);
    }

    public screenToView(x: number, y: number, target: THREE.Vector2): void {
        target.x = (x / this.screenWidth) * 2 - 1;
        target.y = -(y / this.screenHeight) * 2 + 1;
    }

    public screenToWorld(x: number, y: number, target: THREE.Vector3): void {
        this.screenToView(x, y, this.tempVec2);

        console.log(x, y);
        console.log(this.tempVec2);

        this.viewToWorld(this.tempVec2.x, this.tempVec2.y, target);
    }
}
