import { System } from '~/ecs';
import type { GUI } from 'lil-gui';

export abstract class ShooterSystem extends System {
    public onDebug(gui: GUI): void {}
}
