import { Bits } from '~/utils/Bits';

export enum CollisionCategory {
    Projectile = Bits.bit(1),
    Enemy = Bits.bit(2),
    Player = Bits.bit(3),
}
