#version 300 es

precision highp float;
out vec4 FragColor;

in vec4 vColor;

void main()
{
    FragColor = vColor;
} 
