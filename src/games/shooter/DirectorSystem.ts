import { System, type World } from '~/ecs';
import { DebugableSystem } from '../../systems/DebugableSystem';
import { type Scene } from '@babylonjs/core/scene';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { raycast2 } from '../../utils/raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { Bits } from '~/utils/Bits';
import { FilterCategory } from '../../FilterCategory';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeSphere } from '@babylonjs/core/Physics/v2/physicsShape';
import {
    PhysicsConstraintAxis,
    PhysicsMotionType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { GUI } from 'lil-gui';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Physics6DoFConstraint } from '@babylonjs/core/Physics/v2/physicsConstraint';
import { type Camera } from '@babylonjs/core/Cameras/camera';
import { fib } from '~/utils/fib';

// Это нужно для CubeTexture.CreateFromPrefilteredData
// import '@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader';

// Это нужно для scene.createDefaultSkybox
// import '@babylonjs/core/Helpers/sceneHelpers.js';

export class DirectorSystem extends DebugableSystem {
    private readonly roomSize = fib(10);

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();
    }

    public override onUpdate(world: World, deltaSec: number): void {}

    private addPistol() {}
}

class Pistol {}
class Thing {}
class Model {}
class RigibBody {}
class GameObject {}

// export class PistolSystem extends ShooterSystem {
//     private readonly roomSize = fib(10);

//     public constructor(private readonly world: World, private readonly scene: Scene) {
//         super();
//     }

//     @System.on([Pistol])
//     private onPistol(world: World, id: number) {

//     }
// }
