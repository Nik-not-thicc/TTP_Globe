varying vec3 vectorNormal;

void main(){ 
    float intensity = pow(0.5 - dot(vectorNormal, vec3(0,0,1.0)),2.0);

    gl_FragColor = vec4( vec4(0.3,0.6,1.0,1.0)*intensity);
}