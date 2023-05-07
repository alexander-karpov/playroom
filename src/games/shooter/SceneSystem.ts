import {
    BoxGeometry,
    Mesh,
    AmbientLight,
    DirectionalLight,
    type Scene,
    MeshStandardMaterial,
    MathUtils,
} from 'three';
import { System, type World } from '~/ecs';

export class SceneSystem extends System {
    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        /**
         * Light
         */
        const ambientLight = new AmbientLight(0x444444);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 0.5);
        scene.add(directionalLight);

        const boxGeom = new BoxGeometry(32, 32, 32);

        let i = 0;
        while (i++ < 100) {
            const mesh = new Mesh(boxGeom, new MeshStandardMaterial({ color: 0xffffff }));

            mesh.position.set(
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000)
            );

            scene.add(mesh);
        }
    }
}
