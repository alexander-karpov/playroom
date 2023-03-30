import { System, type World } from '@ecs';
import { WebGLRenderer } from 'three';
import { Scene } from '@components/Scene';

export class RenderingSystem extends System {
    public readonly renderer: WebGLRenderer;

    public constructor() {
        super();

        /**
         * Renderer, scene
         */
        this.renderer = new WebGLRenderer();

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    public override onOutput(world: World, deltaS: number): void {
        const sceneIds = world.select([Scene]);

        for (const sceneId of sceneIds) {
            const scene = world.getComponent(Scene, sceneId);

            this.renderer.render(scene.scene, scene.camera);
        }
    }
}
