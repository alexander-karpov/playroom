import { Runtime } from '~/ecs';
import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { SceneSystem } from './SceneSystem';
import { SkySystem } from '~/systems/SkySystem';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Following2DCameraSystem } from './Following2DCameraSystem';
import { JoystickSystem } from './JoystickSystem';
import { AirplaneSystem } from './AirplaneSystem';
import { PlayerControllerSystem } from './PlayerControllerSystem';
import { EnemyControllerSystem } from './EnemyControllerSystem';
import { HitSystem } from './HitSystem';
import { PlayerShootingSystem } from './PlayerShootingSystem';

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
         * Systems
         */
        const systemsRuntime = new Runtime([
            new SceneSystem(scene),
            new SkySystem(projectionHelper, scene),
            new Following2DCameraSystem(camera),
            new JoystickSystem(64, renderer),
            new AirplaneSystem(),
            new PlayerControllerSystem(),
            new EnemyControllerSystem(),
            new HitSystem(scene),
            new PlayerShootingSystem(),
        ]);

        systemsRuntime.initialize();

        return systemsRuntime;
    }
}
