import type { World, EntityId } from './World';

export type EntityChangeHandler = (world: World, entityId: EntityId) => void;
