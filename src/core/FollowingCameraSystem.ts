import { System, type World } from '../ecs';
import { Actor, Camera, Player } from '../components';

export class FollowingCameraSystem extends System {
    public override onSimulate(world: World, delta: number): void {
        const playerId = world.first([Player, Actor]);
        const playerActor = world.getComponent(Actor, playerId);

        const camera = world.firstComponent(Camera);

        camera.position.x = playerActor.body.position.x;
        camera.position.y = playerActor.body.position.y;
    }
}
