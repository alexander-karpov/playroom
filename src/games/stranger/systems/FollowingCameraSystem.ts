import { System, type World } from '~/ecs';
import { Actor, Camera, Player } from '../components';
import { lerp } from '~/utils/lerp';

export interface FollowingCameraSystemOptions {
    readonly followingSpeed: number;
}

export class FollowingCameraSystem extends System {
    // public constructor(private readonly options: FollowingCameraSystemOptions) {
    //     super();
    // }
    // public override onSimulate(world: World, delta: number): void {
    //     const playerId = world.first([Player, Actor]);
    //     const playerActor = world.getComponent(Actor, playerId);
    //     const camera = world.firstComponent(Camera);
    //     const t = this.options.followingSpeed * (delta / 1000);
    //     camera.position.x = lerp(camera.position.x, playerActor.body.position.x, t);
    //     camera.position.y = lerp(camera.position.y, playerActor.body.position.y, t);
    // }
}
