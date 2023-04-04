import { Runtime } from '~/ecs';
import { changeMatterJsRandomSeed } from '~/utils/changeMatterJsRandomSeed';
import { SceneSystem } from './SceneSystem';
import { PhysicsSystem } from '~/systems/PhysicsSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsManagerSystem } from './StarsManagerSystem';
import { EnvironmentSystem } from './EnvironmentSystem';
import * as THREE from 'three';
import { ProjectionHelper } from '~/utils/ProjectionHelper';

changeMatterJsRandomSeed();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer();

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = 50;

// MatterJs плохо работает с очень маленькими цифрами
// по-этому делаем все объекты больших размеров
camera.scale.z = 0.05;

/**
 * Предварительный пустой рендер обновляет что-то в камере,
 * без чего не работает Raycaster и сложно спроецировать
 * края экрана в мировое пространство
 */
renderer.render(scene, camera);

/**
 * ProjectionHelper
 */
const projectionHelper = new ProjectionHelper(renderer, camera);

/**
 * Systems
 */

const systemsRuntime = new Runtime([
    new SceneSystem(renderer, scene, camera),
    new PhysicsSystem(),
    new AudioSystem(),
    new PuzzleSystem(),
    new StarsManagerSystem(),
    new EnvironmentSystem(projectionHelper),
]);

systemsRuntime.initialize();

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaS = (time - lastTime) / 1000;
    lastTime = time;

    systemsRuntime.update(
        // Когда вкладка становится неактивной, в deltaS накапливается
        // очень большое время. При возвращении назад во вкладку, происходит
        // взрыв физики если передать его в таком виде
        deltaS > 0.1 ? 0.1 : deltaS
    );

    renderer.render(scene, camera);
}

animate(performance.now());
