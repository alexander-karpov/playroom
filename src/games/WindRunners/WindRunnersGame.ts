import { Runtime, World } from '~/ecs';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { SceneSystem } from './SceneSystem';
import { DustSystem } from '~/systems/DustSystem';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { ShipCameraSystem } from './ShipCameraSystem';
import { JoystickSystem } from './JoystickSystem';
import { ShipSystem } from './ShipSystem';
import { PlayerControllerSystem } from './PlayerControllerSystem';
import { EnemyControllerSystem } from './EnemyControllerSystem';
import { HitSystem } from './HitSystem';
import { ShootingSystem } from './ShootingSystem';
import { TargetSelectionSystem } from './TargetSelectionSystem';
import { Engine } from 'matter-js';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { EnemySpawnSystem } from './EnemySpawnSystem';

export class WindRunnersGame extends Game {
    protected override configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        lil: GUI
    ): Runtime {
        /**
         * ProjectionHelper
         */
        const projectionHelper = new ProjectionHelper(this.screenSizeSource, camera);

        /**
         * Physics
         */
        const engine = Engine.create({
            gravity: { x: 0, y: 0 },
            // TODO: не работает засыпание, предметы просто зависают
            enableSleeping: false,
        });

        /**
         * Systems
         */
        const world = new World();

        const systemsRuntime = new Runtime(
            world,
            [
                new EnemyControllerSystem(),
                new HitSystem(engine),
                new JoystickSystem(64, renderer),
                new PlayerControllerSystem(world, scene, engine),
                new SceneSystem(scene, engine),
                new ShipCameraSystem(camera),
                new ShipSystem(),
                new ShootingSystem(scene, engine),
                new DustSystem(projectionHelper, scene),
                new SyncPhysicsSystem(engine),
                new TargetSelectionSystem(scene),
                new EnemySpawnSystem(world, scene, engine),
            ],
            3
        );

        systemsRuntime.initialize();

        return systemsRuntime;
    }

    protected override createCamera(): THREE.Camera {
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );

        this.screenSizeSource.consume((w, h) => {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });

        camera.position.setZ(1000);

        return camera;
    }
}
