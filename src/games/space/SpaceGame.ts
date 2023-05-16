import { Runtime, World } from '~/ecs';
import * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from './Game';
import { SceneSystem } from './systems/SceneSystem';
import { DustSystem } from '~/games/space/systems/DustSystem';
import { ShipCameraSystem } from './systems/ShipCameraSystem';
import { JoystickSystem } from './systems/JoystickSystem';
import { ShipSystem } from './systems/ShipSystem';
import { PlayerControllerSystem } from './systems/PlayerControllerSystem';
import { EnemyControllerSystem } from './systems/EnemyControllerSystem';
import { HitSystem } from './systems/HitSystem';
import { ShootingSystem } from './systems/ShootingSystem';
import { TargetSelectionSystem } from './systems/TargetSelectionSystem';
import { Engine } from 'matter-js';
import { SyncPhysicsSystem } from '~/games/space/systems/SyncPhysicsSystem';
import { SurvivalSpawnSystem } from './systems/SurvivalSpawnSystem';
import { HudSystem } from './systems/HudSystem';
import { PlayerDamageSystem } from './systems/PlayerDamageSystem';
import { AudioSystem } from '~/games/space/systems/AudioSystem';
import { ProjectionUtil } from '~/utils/ProjectionUtil';
import { ExplosionsSystem } from './systems/ExplosionsSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { MainMenuSystem } from './systems/MainMenuSystem';

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
