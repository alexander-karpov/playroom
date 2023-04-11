import * as THREE from 'three';

export class SizedPointsMaterial extends THREE.ShaderMaterial {
    private static readonly vertexShader = `
    attribute float size;
    varying vec3 vColor;

    void main() {
        vColor = color;

        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = size;
    }`;

    private static readonly fragmentShader = `
    uniform sampler2D pointTexture;

    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4( vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
    }
    `;

    public constructor(
        pointTexture: THREE.Texture,
        depthTest: boolean,
        transparent: boolean,
        vertexColors: boolean
    ) {
        super({
            uniforms: {
                pointTexture: {
                    value: pointTexture,
                },
            },
            vertexShader: SizedPointsMaterial.vertexShader,
            fragmentShader: SizedPointsMaterial.fragmentShader,

            blending: THREE.AdditiveBlending,
            depthTest,
            transparent,
            vertexColors,
        });
    }
}
