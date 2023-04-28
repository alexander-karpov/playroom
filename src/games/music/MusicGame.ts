import { Runtime, World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsSystem } from './StarsSystem';
import type * as THREE from 'three';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Engine } from 'matter-js';
import { JunkSystem } from './JunkSystem';
import { SkySystem } from '../../systems/SkySystem';
import type GUI from 'lil-gui';
import { Game } from '../../Game';
import { changeMatterJsRandomSeed } from '~/utils/changeMatterJsRandomSeed';
import { Common } from 'matter-js';

export class MusicGame extends Game {
    public override run(): void {
        changeMatterJsRandomSeed(Common);

        return super.run();
    }

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
        const world = new World();

        const systemsRuntime = new Runtime(world, [
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
