import { Runtime, World } from '~/ecs';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { SceneSystem } from './SceneSystem';
import { DustSystem } from '~/systems/DustSystem';
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
import { SurvivalSpawnSystem } from './SurvivalSpawnSystem';
import { HudSystem } from './HudSystem';
import { PlayerDamageSystem } from './PlayerDamageSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { ProjectionUtil } from '~/utils/ProjectionUtil';
import { ExplosionsSystem } from './ExplosionsSystem';
import { ScoreSystem } from './ScoreSystem';
import { MainMenuSystem } from './MainMenuSystem';

export class SpaceGame extends Game {
    protected override configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        lil: GUI
    ): Runtime {
        /**
         * Physics
         */
        const engine = Engine.create({
            gravity: { x: 0, y: 0 },
        });

        /**
         * ProjectionUtil
         */
        const projUtil = new ProjectionUtil(this.screenSize, camera);

        /**
         * Systems
         */
        const world = new World();

        const systemsRuntime = new Runtime(world);

        for (const system of [
            new EnemyControllerSystem(world, scene, engine),
            new HitSystem(world, engine),
            new JoystickSystem(world, 64, renderer),
            new PlayerControllerSystem(),
            new PlayerDamageSystem(world, scene, engine),
            new SceneSystem(world, scene, engine),
            new ShipCameraSystem(camera),
            new ShipSystem(),
            new ShootingSystem(world, scene, engine),
            new DustSystem(scene, projUtil, this.screenSize),
            new SyncPhysicsSystem(engine),
            new TargetSelectionSystem(scene),
            new SurvivalSpawnSystem(world, scene, engine),
            new HudSystem(world),
            new AudioSystem(world),
            new ExplosionsSystem(world, scene),
            new ScoreSystem(world, scene),
            new MainMenuSystem(world, engine),
        ]) {
            systemsRuntime.addSystem(system);
        }

        return systemsRuntime;
    }

    protected override createCamera(): THREE.Camera {
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );

        this.screenSize.consume((w, h) => {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });

        camera.position.setZ(1500);

        return camera;
    }
}
