import { ShooterGame } from './ShooterGame';
import HavokPhysics from '@babylonjs/havok';

void (async () => {
    const havokInterface = await HavokPhysics();

    new ShooterGame(havokInterface).run();
})();
