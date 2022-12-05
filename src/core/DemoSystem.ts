import { SimulationTime, System, World } from "../ecs";
import { BoxGeometry, MeshBasicMaterial, Mesh as ThreeMesh } from 'three';
import { Mesh } from "./Mesh";
import { Renderer } from "./Renderer";


export class DemoSystem extends System {
    public override onCreate(world: World): void {
        const [, mesh] = world.addEntity(Mesh);

        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        mesh.mesh = new ThreeMesh(geometry, material);

        for (const entity of world.select([Renderer])) {
            world.getComponent(Renderer, entity).scene!.add(mesh.mesh);
        }
    }

    public override onUpdate(world: World, time: SimulationTime): void {
        for (const entity of world.select([Mesh])) {
            const { mesh } = world.getComponent(Mesh, entity);

            mesh!.rotation.x += 0.01;
            mesh!.rotation.y += 0.01;
        }
    }
}