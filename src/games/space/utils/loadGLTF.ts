import { type GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const gltfLoader = new GLTFLoader();

export function loadGLTF(filename: string): Promise<GLTF> {
    return new Promise<GLTF>((resolve, reject) => {
        gltfLoader.load(`./assets/models/${filename}`, resolve, function onProgress() {}, reject);
    });
}
