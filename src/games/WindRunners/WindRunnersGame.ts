import { Runtime } from '~/ecs';
import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { SceneSystem } from './SceneSystem';
import { SkySystem } from '~/systems/SkySystem';
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
        const systemsRuntime = new Runtime([
            new SyncPhysicsSystem(engine),
            new SceneSystem(scene, camera as THREE.OrthographicCamera, engine),
            new SkySystem(projectionHelper, scene),
            new ShipCameraSystem(camera),
            new JoystickSystem(64, renderer),
            new ShipSystem(),
            new PlayerControllerSystem(),
            new EnemyControllerSystem(),
            new HitSystem(),
            new ShootingSystem(scene, engine),
            new TargetSelectionSystem(scene),
        ]);

        systemsRuntime.initialize();

        return systemsRuntime;
    }
}
