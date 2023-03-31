/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * Методы для типизированного хранения полей
 */

export function setEntityId(data: any, entityId: number): void {
    data.entityId = entityId;
}

export function entityId(data: any): number | undefined {
    return data.entityId;
}
