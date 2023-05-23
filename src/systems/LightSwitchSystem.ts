import { System, type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { DebugableSystem } from './DebugableSystem';
import { LightSwitch } from '~/components/LightSwitch';
import { LongTap } from '~/components/LongTap';

export class LightSwitchSystem extends DebugableSystem {
    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();
    }

    @System.on([LightSwitch, LongTap])
    public onLightSwitchTouched(world: World, id: number) {
        const { lightUniqueIds } = this.world.get(id, LightSwitch);

        for (const lightId of lightUniqueIds) {
            const light = this.scene.getLightByUniqueId(lightId);

            if (light) {
                light.setEnabled(!light.isEnabled());
            }
        }
    }
}
