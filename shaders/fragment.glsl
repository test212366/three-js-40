uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.1415926;
varying float vOpacity;


void main() {
	vec2 uv =  vec2(gl_PointCoord.x, 1. - gl_PointCoord.y); 

	vec2 cUV = 2. * uv - 1.;
	vec3 originalColor = vec3(4./255., (10. + vOpacity * 500.)/255., 20./255.);
	vec4 color = vec4(0.08 / length(cUV));

	color.rgb = min(vec3(10.), color.rgb);

	color.rgb *= originalColor * 120.;
	color *= vOpacity;
	color.a = min(1., color.a) * 10.;


	float disc = length(cUV);


	gl_FragColor = vec4(color.rgb, color.a);
}