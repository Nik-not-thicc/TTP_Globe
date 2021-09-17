varying vec3 vectorNormal;
void main(){
    vectorNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}