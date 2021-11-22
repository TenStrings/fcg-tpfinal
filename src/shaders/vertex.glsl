#version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec4 aColor;
layout (location = 2) in vec3 aNormal;

uniform mat4 mvp;
uniform mat4 mv;

out vec4 vColor;
out vec3 normCoord;
out vec4 vertCoord;

void main()
{
    gl_Position = mvp * vec4(aPos, 1.0);

    vColor = aColor;

    normCoord = aNormal; 
    vertCoord = mv * vec4(aPos, 1);
}
