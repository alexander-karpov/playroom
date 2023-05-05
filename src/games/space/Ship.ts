import { Vector3 } from 'three';

export class Ship {
    public readonly direction = new Vector3(1, 0, 0);
    public readonly targetDirection = new Vector3(1, 0, 0);
    public speed: number = 800;
    public bootsOn: boolean = false;
    public turningSpeed: number = 1;
    public health = 1;
    public maxHealth = 1;
}
