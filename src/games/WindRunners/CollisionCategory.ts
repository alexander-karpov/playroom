import { Bits } from '~/utils/Bits';

export enum CollisionCategory {
    Projectile = Bits.bit(1),
    Ship = Bits.bit(2),
}
