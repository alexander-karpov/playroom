import type { HP_BodyId, HP_WorldId, HavokPhysicsWithBindings, Quaternion } from '@babylonjs/havok';
import { Result, Vector3 } from '@babylonjs/havok';
import { System, type World } from '~/ecs';
import {
    BoxGeometry,
    Mesh,
    AmbientLight,
    DirectionalLight,
    type Scene,
    MeshStandardMaterial,
    MathUtils,
} from 'three';
import { readEntityId, writeEntityId } from '~/utils/extraProps';

export class SceneSystem extends System {
    private readonly worldId: HP_WorldId;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly havok: HavokPhysicsWithBindings
    ) {
        super();

        /**
         * Light
         */
        const ambientLight = new AmbientLight(0x444444);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 0.5);
        scene.add(directionalLight);

        const [result, worldId] = this.havok.HP_World_Create();
        this.worldId = worldId;

        console.log(`
            create hawok world ${result}
            worldId ${String(worldId)}
        `);

        const boxGeom = new BoxGeometry(32, 32, 32);

        let i = 0;
        while (i++ < 100) {
            const pos: [number, number, number] = [
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000),
            ];

            const mesh = new Mesh(boxGeom, new MeshStandardMaterial({ color: 0xffffff }));

            mesh.position.set(
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000),
                MathUtils.randFloatSpread(2000)
            );

            scene.add(mesh);

            const [, bodyId] = this.havok.HP_Body_Create();
            const [, shapeId] = this.havok.HP_Shape_CreateBox(
                pos,
                mesh.quaternion.toArray() as Quaternion,
                [32, 32, 32]
            );

            this.havok.HP_Body_SetShape(bodyId, shapeId);

            this.havok.HP_World_AddBody(this.worldId, bodyId, false);

            writeEntityId(mesh.userData, bodyId);
        }
    }

    public override onOutput(world: World, deltaSec: number): void {
        this.havok.HP_World_Step(this.worldId, deltaSec);

        const [, worldOffset] = this.havok.HP_World_GetBodyBuffer(this.worldId);

        for (const o of this.scene.children) {
            if ('isMesh' in o && Boolean(o.isMesh)) {
                const bodyId = readEntityId<HP_BodyId>(o.userData);

                if (!bodyId) {
                    throw new Error('no bodyId');
                }

                const [, trOffset] = this.havok.HP_Body_GetWorldTransformOffset(bodyId);

                console.log(this.havok.HEAPF32[worldOffset + trOffset]);
            }
        }
    }
}
