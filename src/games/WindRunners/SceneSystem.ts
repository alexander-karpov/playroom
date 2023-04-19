import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Player } from './Player';
import { GameObject } from '~/components';
import { Joystick } from './Joystick';
import { Jet } from './Jet';

export class SceneSystem extends System {
    private readonly dir = new THREE.Vector3(1, 0, 0);

    private go!: GameObject;

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

                this.go = go;
                go.object3d = gltf.scene;
                go.object3d.scale.multiplyScalar(0.15);

                const jet = world.addComponent(Jet, id);
                jet.direction = new THREE.Vector3(1, 0, 0);
                jet.speed = 500;
            }
        );
    }

    public override onSimulate(world: World, deltaS: number): void {
        if (!this.go) {
            return;
        }

        // for (const joystickId of world.select([Joystick])) {
        //     const joystick = world.getComponent(Joystick, joystickId);
        //     if (joystick.tilt === 0) {
        //         continue;
        //     }

        //     const dir = joystick.direction;
        //     const speed = joystick.tilt * 10;

        //     const q = new THREE.Quaternion();
        //     q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dir.x, -dir.y, 0));

        //     this.go.object3d.position.add(
        //         new THREE.Vector3(dir.x, -dir.y, 0).multiplyScalar(speed)
        //     );

        //     this.go.object3d.quaternion.rotateTowards(q, deltaS * speed);
        // }
    }
}
