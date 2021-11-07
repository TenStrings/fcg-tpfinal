#version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec4 aColor;

uniform mat4 translation;
uniform mat4 projection;
uniform mat4 rotationX;
uniform mat4 rotationY;
uniform mat4 rotationZ;
uniform mat4 scale;

uniform mat4 mvp;

out vec4 vColor;

void main()
{
    // mat4 modelMatrix = translation * rotationY * rotationZ * rotationX * scale;
    gl_Position = mvp * vec4(aPos, 1.0);

    vColor = aColor;
}
