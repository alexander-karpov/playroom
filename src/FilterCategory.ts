import { Bits } from './utils/Bits';

/**
 * Используется для масок коллизий
 */
export enum FilterCategory {
    Static = 1,
    Thing = 2,
    Hand = 3,
    Player = 4,
}

export function getCategoryMask(category: FilterCategory): number {
    return Bits.bit(category);
}

export function getCollideMaskFor(category: FilterCategory): number {
    const { Static, Thing, Player } = FilterCategory;

    switch (category) {
        case Static:
            return Bits.bit2(Thing, Player);
        case Thing:
            return Bits.bit2(Thing, Static);
        case Player:
            return Bits.bit(Static);
        default:
            return 0;
    }
}
