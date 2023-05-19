import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/core/Loading/loadingScreen';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import '@babylonjs/core/Physics/joinedPhysicsEngineComponent';
import HavokPhysics from '@babylonjs/havok';
import { Runtime, type World } from '~/ecs';
import { SceneSystem } from './SceneSystem';
import { ShooterCamera } from './ShooterCamera';
import { ShooterSystem } from './ShooterSystem';
import { HandsSystem } from './HandsSystem';
import { type Scene } from '@babylonjs/core/scene';

import { AssetsManager, type MeshAssetTask } from '@babylonjs/core/Misc/assetsManager';

import '@babylonjs/loaders/glTF';
import { GLTFLoader } from '@babylonjs/loaders/glTF/2.0/glTFLoader';
import { GLTFFileLoader } from '@babylonjs/loaders/glTF';

export class AssetsSystem extends ShooterSystem {
    private readonly assetsManager = new AssetsManager(this.scene);

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        const meshTask = this.assetsManager.addContainerTask(
            'glock17',
            '',
            './assets/models/',
            'Glock17.glb'
        );

        meshTask.onSuccess = (task) => {
            // @ts-ignore
            window.t = task;
        };

        this.assetsManager.load();
    }

    public override onUpdate(world: World, deltaSec: number): void {}
}
