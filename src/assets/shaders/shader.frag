precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform sampler2D uGradientTexture;

uniform float uDensity;
uniform float uRatio;

uniform float uViewportX;
uniform float uViewportY;

uniform vec2 uViewport;
uniform float uSteps;

// Dato un colore ne restituisce la luminanza
float getLuminance(vec3 col) {
    return 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
}

// Stabilisce se le coordinate uv sono dentro o fuori ad un quadrato. 1.0 se dentro, 0.0 se fuori

float getSquare(vec2 uv, float size) {
    float inverseHalfSize = (1.0 - size) / 2.0;

    return step(inverseHalfSize, uv.x) * 
            (1.0 - step(1.0 - inverseHalfSize, uv.x)) *
            step(inverseHalfSize, uv.y) * 
            (1.0 - step(1.0 - inverseHalfSize, uv.y)); 
}


// Ripete gli uv (quindi vanno da 0.0 a 1.0, poi da 0.0 a 1.0 per N volte)
vec2 repeatUv(vec2 uv, vec2 repetitions) {
    //return fract(vec2(uv.x * uRatio, uv.y) * repetitions);
    return fract(uv * repetitions);
}

// quantizza gli uv in N valori
vec2 quantizeUv(vec2 uv, vec2 steps) {
    return floor(uv * steps) / steps;
}

void main() {

    // uv
    vec2 uv = vTexCoord;

    uv.x = 1.0 - uv.x;
   
    uv.y *= uViewportY;
    uv.y += (1.0 - uViewportY) / 2.0;

    uv.x *= uViewportX;
    uv.x += (1.0 - uViewportX) / 2.0;

    vec2 correctedDensity = vec2(uDensity * uRatio / uViewportX, uDensity / uViewportY);  

    vec2 repeatedUv = repeatUv(uv, correctedDensity);

    vec2 quantizedUv = quantizeUv(uv, correctedDensity);

    vec3 quantizedTextureRGB = texture2D(uTexture, quantizedUv).rgb; 

    float luma = getLuminance (quantizedTextureRGB);

    // vec3 gradientMap = texture2D(uGradientTexture, quantizeUv(vec2(luma, 0.5), vec2(6.0, 1.0))+ vec2(1.0 / 12.0 , 0.0)).rgb;

    float lumaStep = floor(luma * uSteps) / uSteps;

    vec3 gradientMap = texture2D(uGradientTexture, vec2((1.0 - repeatedUv.x) / (uSteps) + (1.0 - lumaStep), repeatedUv.y)).rgb;

    // float squareSize = luma * 0.8;

    // float square = getSquare(repeatedUv, squareSize);

    vec4 coloredSquare = vec4(gradientMap, 1.0); 
    
    gl_FragColor = coloredSquare; // Debug uv
    
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}