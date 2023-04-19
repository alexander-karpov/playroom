import { Runtime } from '~/ecs';
import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Engine } from 'matter-js';

import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { SceneSystem } from './SceneSystem';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { SkySystem } from '~/systems/SkySystem';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Following2DCameraSystem } from './Following2DCameraSystem';

class WindRunnersGame extends Game {
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
            gravity: { x: 0, y: -1 },
            // TODO: не работает засыпание, предметы просто зависают
            enableSleeping: false,
        });

        /**
         * ProjectionHelper
         */
        const projectionHelper = new ProjectionHelper(this.screenSizeSource, camera);

        /**
         * Systems
         */
        const systemsRuntime = new Runtime([
            new SceneSystem(scene, engine),
            // new SyncPhysicsSystem(engine),
            new SkySystem(projectionHelper, scene),
            new Following2DCameraSystem(camera),
        ]);

        systemsRuntime.initialize();

        return systemsRuntime;
    }
}

new WindRunnersGame().run();
