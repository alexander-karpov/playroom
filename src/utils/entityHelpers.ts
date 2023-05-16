/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

/**
 * Методы для типизированного хранения полей
 */

export function writeEntityId<T>(data: any, entityId: T): void {
    data.entityId = entityId;
}

export function readEntityId<T>(data: any): T | undefined {
    return data.entityId;
}
