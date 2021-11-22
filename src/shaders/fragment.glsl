#version 300 es

precision highp float;
out vec4 FragColor;

in vec4 vColor;
in vec3 normCoord;
in vec4 vertCoord;

uniform mat3 mn;
uniform vec3 lightDir;
uniform float shininess;

void main()
{
    vec3 n = normalize(mn * normCoord);
    vec3 l = normalize(lightDir - vertCoord.xyz);

    vec3 v = normalize(-1.0 * vec3(vertCoord.x, vertCoord.y, vertCoord.z));
    vec3 h = normalize(l + v);

    float cos_theta = dot(n, l);
    float cos_omega = dot(n, h);

    vec4 I = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 K_d = vec4(1.0, 0.0, 0.5, 1.0);
    // vec4 K_d = vColor;
    vec4 I_a = vec4(0.0, 0.2, 0.0, 0.0);

    vec4 K_s = vec4(1.0, 1.0, 1.0, 1.0);

    vec4 sp = pow(max(0.0, cos_omega), shininess) * K_s;

    // FragColor = I * max(0.0, cos_theta) * ( K_d + (sp / cos_theta) ) + dot(I_a, K_d);
    // so, I guess cos_theta is always negative?
    FragColor = I * max(0.0, cos_theta) * (K_d + (sp / cos_theta)) + dot(I_a, K_d);
} 

