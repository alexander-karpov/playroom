import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Player } from './Player';
import { GameObject } from '~/components';
import { Airplane } from './Airplane';

export class SceneSystem extends System {
    public constructor(private readonly scene: THREE.Scene) {
        super();

        /**
         * Light
         */
        const ambientLight = new THREE.AmbientLight(0xf0f0f0); // soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);
    }

    public override onCreate(world: World): void {
        // Instantiate a loader
        const loader = new GLTFLoader();

        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
        loader.setDRACOLoader(dracoLoader);

        // Load a glTF resource
        loader.load(
            // resource URL
            './assets/models/Spaceship1.glb',
            // called when the resource is loaded
            (gltf) => {
                this.scene.add(gltf.scene);

                const [id] = world.addEntity(Player);
                const go = world.addComponent(GameObject, id);

                go.object3d = gltf.scene;
                go.object3d.scale.multiplyScalar(0.15);

                const airplane = world.addComponent(Airplane, id);
                airplane.direction = new THREE.Vector3(1, 0, 0);
                airplane.speed = 600;
                airplane.turningSpeed = 4;
            }
        );
    }
}
