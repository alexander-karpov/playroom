import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { SoundTracks } from '~/systems/AudioSystem';
import { Active } from '~/components';

export class PuzzleSystem extends System {
    @System.on([Star, Active])
    private onStarActive(world: World, entity: number): void {
        const activeStars = world.select([Star, Active]);
        const starsNo = activeStars.map((id) => world.getComponent(Star, id).numberInOrder).sort();

        // Активированные звёзды должны идти по порядку
        for (let i = 0; i < starsNo.length; i++) {
            if (starsNo[i] !== i) {
                this.deactivateAllStars(activeStars, world);

                return;
            }
        }

        const totalStars = world.cound([Star]);

        console.log({ totalStars, activeStars: activeStars.length });
        if (activeStars.length === totalStars) {
            // 🎉 Ураа!!1 🎉
            this.deactivateAllStars(activeStars, world);
            this.addStar(world, totalStars, SoundTracks.XylophoneD1, 2);
        }
    }

    private deactivateAllStars(activeStars: readonly number[], world: World) {
        for (const star of activeStars) {
            world.deleteComponent(Active, star);
        }
    }

    public override onCreate(world: World): void {
        const puzzle = [
            { no: 0, track: SoundTracks.XylophoneD1, size: 1 },
            { no: 1, track: SoundTracks.XylophoneE1, size: 2 },
            { no: 2, track: SoundTracks.XylophoneF, size: 3 },
        ];

        for (const { no, track, size } of puzzle) {
            this.addStar(world, no, track, size);
        }
    }

    private addStar(world: World, no: number, track: SoundTracks, size: number) {
        const [, star] = world.addEntity(Star);

        star.numberInOrder = no;
        star.soundtrack = track;
        star.size = size;
    }
}
