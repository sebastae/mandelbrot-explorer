#define product(a, b) vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x)

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

int iterate(vec2 z, vec2 c){
    vec2 p = c;
    for(int i = 0; i < 1000; i++){
        p = product(p, p) + c;
        if(length(p) > 4.0){
            return i;
        }
    }
    return 0;
}

uniform vec2 u_resolution;
uniform vec4 u_view;
void main(){
    vec2 pos = gl_FragCoord.xy / u_resolution.xy;
    vec2 topLeft = u_view.xy*vec2(1.0, -1.0);
    vec2 bottomRight = u_view.zw*vec2(1.0, -1.0);

    vec2 c = vec2(topLeft.x + (bottomRight.x - topLeft.x) * pos.x,
                  topLeft.y + (bottomRight.y - topLeft.y) * pos.y);


    float v = mod(float(iterate(vec2(0,0), c)), 100.0)/100.0;
    gl_FragColor = vec4(0.0, 0.0, v, 1.0);
}