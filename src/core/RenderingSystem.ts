import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { SimulationTime, System, World } from "../ecs";
import { Renderer } from './Renderer';

export class RenderingSystem extends System {
    public override onCreate(world: World): void {
        const [, component] = world.addEntity(Renderer);

        component.renderer = new WebGLRenderer();
        component.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(component.renderer.domElement);

        component.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        component.camera.position.z = 5;

        component.scene = new Scene();
    }

    public override onUpdate(world: World, time: SimulationTime): void {
        for (const entity of world.select([Renderer])) {
            const renderer = world.getComponent(Renderer, entity);

            renderer.renderer!.render(renderer.scene!, renderer.camera!);
        }
    }
}
