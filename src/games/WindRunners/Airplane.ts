import { Vector3 } from 'three';

export class Airplane {
    public speed: number = 800;
    public readonly direction = new Vector3(1, 0, 0);
    public readonly targetDirection = new Vector3(1, 0, 0);
    public engineOn: boolean = false;
    public turningSpeed: number = 1;
}
