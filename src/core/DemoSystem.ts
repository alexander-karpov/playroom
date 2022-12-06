import { System, World } from "../ecs";
import { BoxGeometry, MeshBasicMaterial, Mesh as ThreeMesh, Vector3 } from 'three';
import { Mesh } from "./Mesh";
import { Renderer } from "./Renderer";


export class DemoSystem extends System {
    public override onCreate(world: World): void {

        for (let index = 0; index < 20000; index++) {
            const x = 20;
            addMesh(Math.floor(Math.random() * 16777215), new Vector3(Math.random() * x - x / 2, Math.random() * x - x / 2, Math.random() * x - x / 2));

        }

        addMesh(0x0000ff, new Vector3(1, -1, 0));
        addMesh(0xff0000, new Vector3(0, 1, 0));

        function addMesh(color: number, position: Vector3) {
            const [, mesh] = world.addEntity(Mesh);

            const geometry = new BoxGeometry(1, 1, 1);
            const material = new MeshBasicMaterial({ color });
            mesh.mesh = new ThreeMesh(geometry, material);
            mesh.mesh!.position.copy(position);
        }
    }

    public override onLink(world: World): void {
        for (const rendererEntity of world.select([Renderer])) {
            for (const meshEntity of world.select([Mesh])) {
                world.getComponent(Renderer, rendererEntity).scene!.add(
                    world.getComponent(Mesh, meshEntity).mesh!
                );
            }
        }
    }

    public override onSimulate(world: World, delta: number): void {
        for (const entity of world.select([Mesh])) {
            const { mesh } = world.getComponent(Mesh, entity);

            mesh!.rotation.x += delta;
            mesh!.rotation.y += delta;
        }
    }
}