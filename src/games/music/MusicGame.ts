import { Runtime } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsSystem } from './StarsSystem';
import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';
import type { Engine } from 'matter-js';
import { JunkSystem } from './JunkSystem';
import { SkySystem } from './SkySystem';
import type GUI from 'lil-gui';
import { Game } from '../../Game';

export class MusicGame extends Game {
    protected override configureSystems(
        renderer: THREE.WebGLRenderer,
        composer: EffectComposer,
        camera: THREE.Camera,
        scene: THREE.Scene,
        engine: Engine,
        projectionHelper: ProjectionHelper,
        lil: GUI
    ): Runtime {
        /**
         * Systems
         */
        const systemsRuntime = new Runtime([
            new SceneSystem(projectionHelper, scene, camera, renderer, composer, engine, lil),
            new SkySystem(projectionHelper, scene),
            new SyncPhysicsSystem(engine),
            new AudioSystem(),
            new PuzzleSystem(lil),
            new StarsSystem(scene, engine, lil),
            new JunkSystem(scene, camera, engine, lil),
        ]);

        systemsRuntime.initialize();

        return systemsRuntime;
    }
}
