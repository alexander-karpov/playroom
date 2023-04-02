import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { SoundTracks } from '~/systems/AudioSystem';
import { Active, Sound } from '~/components';
import { delay } from '~/utils/delay';
import { Hint } from './Hint';

export class PuzzleSystem extends System {
    @System.on([Star, Active])
    private onStarActive(world: World, entity: number): void {
        const activeStars = world.select([Star, Active]);
        const starsNo = activeStars.map((id) => world.getComponent(Star, id).numberInOrder).sort();

        // Активированные звёзды должны идти по порядку
        for (let i = 0; i < starsNo.length; i++) {
            if (starsNo[i] !== i) {
                this.deactivateAllStars(activeStars, world);
                this.playHints(world, 1000);
                return;
            }
        }

        const totalStars = world.cound([Star]);

        console.log({ totalStars, activeStars: activeStars.length });
        if (activeStars.length === totalStars) {
            // 🎉 Ураа!!1 🎉
            this.deactivateAllStars(activeStars, world);
            this.addStar(world, totalStars, SoundTracks.XylophoneD1, 2);

            this.playHints(world, 1000);
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

        this.playHints(world, 1000);
    }

    private playHints(world: World, afterMs: number): void {
        const stars = world
            .select([Star])
            .map((en) => ({ entity: en, star: world.getComponent(Star, en) }));

        stars.sort((a, b) => a.star.numberInOrder - b.star.numberInOrder);

        void (async () => {
            await delay(afterMs);

            for (const { entity } of stars) {
                world.addComponent(Hint, entity);

                await delay(500);
            }
        })();
    }

    private deactivateAllStars(activeStars: readonly number[], world: World) {
        for (const star of activeStars) {
            world.deleteComponent(Active, star);
        }
    }

    private addStar(world: World, no: number, track: SoundTracks, size: number) {
        const [, star] = world.addEntity(Star);

        star.numberInOrder = no;
        star.soundtrack = track;
        star.size = size;
    }
}
