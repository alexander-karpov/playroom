/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * Методы для типизированного хранения полей в Matter.Body.plugin
 */

import { type Body } from 'matter-js';

export function setEntityId(body: Body, entityId: number): void {
    body.plugin.entityId = entityId;
}

export function entityId(body: Body): number | undefined {
    return body.plugin.entityId;
}
