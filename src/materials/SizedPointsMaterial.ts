import * as THREE from 'three';

export class SizedPointsMaterial extends THREE.ShaderMaterial {
    private static readonly vertexShader = `
    attribute float size;
    varying vec3 vColor;
    uniform vec2 bounds;

    void main() {
        vec3 vPosition = vec3(position - cameraPosition);

        vec4 boundedPosition = vec4(
             mod(vPosition.xy, bounds) - bounds / vec2(2),
            vPosition.z,
            1.0
        );

        gl_Position = projectionMatrix * boundedPosition;
        gl_PointSize = size;
        vColor = color;
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
                bounds: {
                    value: new THREE.Vector2(1024, 1024),
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

    public setBounds(width: number, height: number) {
        const bounds = this.uniforms['bounds'] as THREE.Uniform<THREE.Vector2>;

        bounds.value.set(width, height);
    }
}
