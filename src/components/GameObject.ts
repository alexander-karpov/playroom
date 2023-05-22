import { type TransformNode } from '@babylonjs/core/Meshes/transformNode';

export class GameObject {
    public node!: TransformNode;
    public instanceIndex?: number;
}
