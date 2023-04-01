/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * Методы для типизированного хранения полей
 */

export function writeEntityId(data: any, entityId: number): void {
    data.entityId = entityId;
}

export function readEntityId(data: any): number | undefined {
    return data.entityId;
}
