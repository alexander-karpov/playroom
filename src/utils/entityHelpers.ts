/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { type Node } from '@babylonjs/core/node';

/**
 * Методы для типизированного хранения полей
 */

export function writeEntityId(node: Node, entityId: number): void {
    node.metadata ??= {};
    node.metadata.entityId = entityId;
}

export function readEntityId(node: Node): number | undefined {
    return node.metadata?.entityId;
}
