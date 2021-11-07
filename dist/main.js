/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var everybody_mp3_1 = __importDefault(__webpack_require__(/*! ./everybody.mp3 */ "./src/everybody.mp3"));
var fragment_glsl_1 = __importDefault(__webpack_require__(/*! ./shaders/fragment.glsl */ "./src/shaders/fragment.glsl"));
var vertex_glsl_1 = __importDefault(__webpack_require__(/*! ./shaders/vertex.glsl */ "./src/shaders/vertex.glsl"));
function components() {
    var canvas = document.createElement('canvas');
    var audio = document.createElement('audio');
    audio.src = everybody_mp3_1["default"];
    audio.controls = true;
    console.log('it loads!');
    var audioContext = new window.AudioContext();
    var track = audioContext.createMediaElementSource(audio);
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    // analyser.fftSize = 4096
    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);
    track.connect(analyser).connect(audioContext.destination);
    var gl = initWebGL(canvas);
    initShaders(vertex_glsl_1["default"], fragment_glsl_1["default"], gl);
    updateCanvasSize(gl, canvas);
    draw(analyser, dataArray, gl);
    return [audio, canvas];
}
components().forEach(function (c) {
    document.body.appendChild(c);
});
function draw(analyser, dataArray, gl) {
    requestAnimationFrame(function () { return draw(analyser, dataArray, gl); });
}
function initWebGL(canvas) {
    // Inicializamos el canvas WebGL
    canvas.oncontextmenu = function () { return false; };
    var gl = canvas.getContext('webgl', { antialias: false, depth: true });
    if (!gl) {
        alert('Imposible inicializar WebGL. Tu navegador quizás no lo soporte.');
        return;
    }
    // Inicializar color clear
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST); // habilitar test de profundidad
    return gl;
}
// Funcion para actualizar el tamaño de la ventana cada vez que se hace resize
function updateCanvasSize(gl, canvas) {
    // 1. Calculamos el nuevo tamaño del viewport
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    var pixelRatio = window.devicePixelRatio || 1;
    canvas.width = pixelRatio * canvas.clientWidth;
    canvas.height = pixelRatio * canvas.clientHeight;
    var width = (canvas.width / pixelRatio);
    var height = (canvas.height / pixelRatio);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    // 2. Lo seteamos en el contexto WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    // 3. Cambian las matrices de proyección, hay que actualizarlas
    // UpdateProjectionMatrix()
}
// Calcula la matriz de perspectiva (column-major)
function projectionMatrix(canvas, z, fov_angle) {
    if (fov_angle === void 0) { fov_angle = 60; }
    var r = canvas.width / canvas.height;
    var n = (z - 1.74);
    var min_n = 0.001;
    if (n < min_n)
        n = min_n;
    var f = (z + 1.74);
    var fov = 3.145 * fov_angle / 180;
    var s = 1 / Math.tan(fov / 2);
    return [
        s / r, 0, 0, 0,
        0, s, 0, 0,
        0, 0, (n + f) / (f - n), 1,
        0, 0, -2 * n * f / (f - n), 0
    ];
}
function initShaders(vsSource, fsSource, wgl) {
    // Función que compila cada shader individualmente
    var vs = compileShader(wgl.VERTEX_SHADER, vsSource, wgl);
    var fs = compileShader(wgl.FRAGMENT_SHADER, fsSource, wgl);
    // Crea y linkea el programa
    var prog = wgl.createProgram();
    wgl.attachShader(prog, vs);
    wgl.attachShader(prog, fs);
    wgl.linkProgram(prog);
    if (!wgl.getProgramParameter(prog, wgl.LINK_STATUS)) {
        alert('No se pudo inicializar el programa: ' + wgl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}
function compileShader(type, source, wgl) {
    var shader = wgl.createShader(type);
    wgl.shaderSource(shader, source);
    wgl.compileShader(shader);
    if (!wgl.getShaderParameter(shader, wgl.COMPILE_STATUS)) {
        alert('Ocurrió un error durante la compilación del shader:' + wgl.getShaderInfoLog(shader));
        wgl.deleteShader(shader);
        return null;
    }
    return shader;
}
// Multiplica 2 matrices y devuelve A*B.
// Los argumentos y el resultado son arreglos que representan matrices en orden column-major
function matrixMult(a, b) {
    var C = [];
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            var v = 0;
            for (var k = 0; k < 4; ++k) {
                v += a[j + 4 * k] * b[k + 4 * i];
            }
            C.push(v);
        }
    }
    return C;
}


/***/ }),

/***/ "./src/shaders/fragment.glsl":
/*!***********************************!*\
  !*** ./src/shaders/fragment.glsl ***!
  \***********************************/
/***/ ((module) => {

module.exports = "out vec4 FragColor;\n\nuniform vec3 color;\n\nvoid main()\n{\nFragColor = vec4(color.xyz, 1.0f);\n} \n"

/***/ }),

/***/ "./src/shaders/vertex.glsl":
/*!*********************************!*\
  !*** ./src/shaders/vertex.glsl ***!
  \*********************************/
/***/ ((module) => {

module.exports = "// layout (location = 0) in vec3 aPos;\n\nuniform mat4 translation;\nuniform mat4 projection;\nuniform mat4 rotation;\nuniform mat4 scale;\n\nvoid main()\n{\n    gl_Position = projection * translation * scale * rotation * vec4(aPos, 1.0);\n}\n"

/***/ }),

/***/ "./src/everybody.mp3":
/*!***************************!*\
  !*** ./src/everybody.mp3 ***!
  \***************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "3b0fd172164e8769e154.mp3";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQWE7QUFDYjtBQUNBLDZDQUE2QztBQUM3QztBQUNBLGtCQUFrQjtBQUNsQixzQ0FBc0MsbUJBQU8sQ0FBQyw0Q0FBaUI7QUFDL0Qsc0NBQXNDLG1CQUFPLENBQUMsNERBQXlCO0FBQ3ZFLG9DQUFvQyxtQkFBTyxDQUFDLHdEQUF1QjtBQUNuRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0Esd0NBQXdDLHVDQUF1QztBQUMvRTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekMsMENBQTBDLCtCQUErQjtBQUN6RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixPQUFPO0FBQzNCLHdCQUF3QixPQUFPO0FBQy9CO0FBQ0EsNEJBQTRCLE9BQU87QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDM0hBLHFDQUFxQyx1QkFBdUIsa0JBQWtCLG9DQUFvQyxJQUFJOzs7Ozs7Ozs7O0FDQXRILHdEQUF3RCw2QkFBNkIsMEJBQTBCLHdCQUF3QixxQkFBcUIsa0JBQWtCLGtGQUFrRixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7OztVQ0FuUTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLEdBQUc7V0FDSDtXQUNBO1dBQ0EsQ0FBQzs7Ozs7V0NQRDtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTs7Ozs7VUVmQTtVQUNBO1VBQ0E7VUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3RwZmluYWwvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vdHBmaW5hbC8uL3NyYy9zaGFkZXJzL2ZyYWdtZW50Lmdsc2wiLCJ3ZWJwYWNrOi8vdHBmaW5hbC8uL3NyYy9zaGFkZXJzL3ZlcnRleC5nbHNsIiwid2VicGFjazovL3RwZmluYWwvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vdHBmaW5hbC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL3RwZmluYWwvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vdHBmaW5hbC93ZWJwYWNrL2JlZm9yZS1zdGFydHVwIiwid2VicGFjazovL3RwZmluYWwvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL3RwZmluYWwvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbnZhciBldmVyeWJvZHlfbXAzXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vZXZlcnlib2R5Lm1wM1wiKSk7XG52YXIgZnJhZ21lbnRfZ2xzbF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuL3NoYWRlcnMvZnJhZ21lbnQuZ2xzbFwiKSk7XG52YXIgdmVydGV4X2dsc2xfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9zaGFkZXJzL3ZlcnRleC5nbHNsXCIpKTtcbmZ1bmN0aW9uIGNvbXBvbmVudHMoKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBhdWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgYXVkaW8uc3JjID0gZXZlcnlib2R5X21wM18xW1wiZGVmYXVsdFwiXTtcbiAgICBhdWRpby5jb250cm9scyA9IHRydWU7XG4gICAgY29uc29sZS5sb2coJ2l0IGxvYWRzIScpO1xuICAgIHZhciBhdWRpb0NvbnRleHQgPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xuICAgIHZhciB0cmFjayA9IGF1ZGlvQ29udGV4dC5jcmVhdGVNZWRpYUVsZW1lbnRTb3VyY2UoYXVkaW8pO1xuICAgIHZhciBhbmFseXNlciA9IGF1ZGlvQ29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgIGFuYWx5c2VyLmZmdFNpemUgPSAyMDQ4O1xuICAgIC8vIGFuYWx5c2VyLmZmdFNpemUgPSA0MDk2XG4gICAgdmFyIGJ1ZmZlckxlbmd0aCA9IGFuYWx5c2VyLmZmdFNpemU7XG4gICAgdmFyIGRhdGFBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlckxlbmd0aCk7XG4gICAgYW5hbHlzZXIuZ2V0Qnl0ZVRpbWVEb21haW5EYXRhKGRhdGFBcnJheSk7XG4gICAgdHJhY2suY29ubmVjdChhbmFseXNlcikuY29ubmVjdChhdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgIHZhciBnbCA9IGluaXRXZWJHTChjYW52YXMpO1xuICAgIGluaXRTaGFkZXJzKHZlcnRleF9nbHNsXzFbXCJkZWZhdWx0XCJdLCBmcmFnbWVudF9nbHNsXzFbXCJkZWZhdWx0XCJdLCBnbCk7XG4gICAgdXBkYXRlQ2FudmFzU2l6ZShnbCwgY2FudmFzKTtcbiAgICBkcmF3KGFuYWx5c2VyLCBkYXRhQXJyYXksIGdsKTtcbiAgICByZXR1cm4gW2F1ZGlvLCBjYW52YXNdO1xufVxuY29tcG9uZW50cygpLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGMpO1xufSk7XG5mdW5jdGlvbiBkcmF3KGFuYWx5c2VyLCBkYXRhQXJyYXksIGdsKSB7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRyYXcoYW5hbHlzZXIsIGRhdGFBcnJheSwgZ2wpOyB9KTtcbn1cbmZ1bmN0aW9uIGluaXRXZWJHTChjYW52YXMpIHtcbiAgICAvLyBJbmljaWFsaXphbW9zIGVsIGNhbnZhcyBXZWJHTFxuICAgIGNhbnZhcy5vbmNvbnRleHRtZW51ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XG4gICAgdmFyIGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgeyBhbnRpYWxpYXM6IGZhbHNlLCBkZXB0aDogdHJ1ZSB9KTtcbiAgICBpZiAoIWdsKSB7XG4gICAgICAgIGFsZXJ0KCdJbXBvc2libGUgaW5pY2lhbGl6YXIgV2ViR0wuIFR1IG5hdmVnYWRvciBxdWl6w6FzIG5vIGxvIHNvcG9ydGUuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gSW5pY2lhbGl6YXIgY29sb3IgY2xlYXJcbiAgICBnbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTsgLy8gaGFiaWxpdGFyIHRlc3QgZGUgcHJvZnVuZGlkYWRcbiAgICByZXR1cm4gZ2w7XG59XG4vLyBGdW5jaW9uIHBhcmEgYWN0dWFsaXphciBlbCB0YW1hw7FvIGRlIGxhIHZlbnRhbmEgY2FkYSB2ZXogcXVlIHNlIGhhY2UgcmVzaXplXG5mdW5jdGlvbiB1cGRhdGVDYW52YXNTaXplKGdsLCBjYW52YXMpIHtcbiAgICAvLyAxLiBDYWxjdWxhbW9zIGVsIG51ZXZvIHRhbWHDsW8gZGVsIHZpZXdwb3J0XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgdmFyIHBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICAgIGNhbnZhcy53aWR0aCA9IHBpeGVsUmF0aW8gKiBjYW52YXMuY2xpZW50V2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IHBpeGVsUmF0aW8gKiBjYW52YXMuY2xpZW50SGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IChjYW52YXMud2lkdGggLyBwaXhlbFJhdGlvKTtcbiAgICB2YXIgaGVpZ2h0ID0gKGNhbnZhcy5oZWlnaHQgLyBwaXhlbFJhdGlvKTtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgLy8gMi4gTG8gc2V0ZWFtb3MgZW4gZWwgY29udGV4dG8gV2ViR0xcbiAgICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIC8vIDMuIENhbWJpYW4gbGFzIG1hdHJpY2VzIGRlIHByb3llY2Npw7NuLCBoYXkgcXVlIGFjdHVhbGl6YXJsYXNcbiAgICAvLyBVcGRhdGVQcm9qZWN0aW9uTWF0cml4KClcbn1cbi8vIENhbGN1bGEgbGEgbWF0cml6IGRlIHBlcnNwZWN0aXZhIChjb2x1bW4tbWFqb3IpXG5mdW5jdGlvbiBwcm9qZWN0aW9uTWF0cml4KGNhbnZhcywgeiwgZm92X2FuZ2xlKSB7XG4gICAgaWYgKGZvdl9hbmdsZSA9PT0gdm9pZCAwKSB7IGZvdl9hbmdsZSA9IDYwOyB9XG4gICAgdmFyIHIgPSBjYW52YXMud2lkdGggLyBjYW52YXMuaGVpZ2h0O1xuICAgIHZhciBuID0gKHogLSAxLjc0KTtcbiAgICB2YXIgbWluX24gPSAwLjAwMTtcbiAgICBpZiAobiA8IG1pbl9uKVxuICAgICAgICBuID0gbWluX247XG4gICAgdmFyIGYgPSAoeiArIDEuNzQpO1xuICAgIHZhciBmb3YgPSAzLjE0NSAqIGZvdl9hbmdsZSAvIDE4MDtcbiAgICB2YXIgcyA9IDEgLyBNYXRoLnRhbihmb3YgLyAyKTtcbiAgICByZXR1cm4gW1xuICAgICAgICBzIC8gciwgMCwgMCwgMCxcbiAgICAgICAgMCwgcywgMCwgMCxcbiAgICAgICAgMCwgMCwgKG4gKyBmKSAvIChmIC0gbiksIDEsXG4gICAgICAgIDAsIDAsIC0yICogbiAqIGYgLyAoZiAtIG4pLCAwXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGluaXRTaGFkZXJzKHZzU291cmNlLCBmc1NvdXJjZSwgd2dsKSB7XG4gICAgLy8gRnVuY2nDs24gcXVlIGNvbXBpbGEgY2FkYSBzaGFkZXIgaW5kaXZpZHVhbG1lbnRlXG4gICAgdmFyIHZzID0gY29tcGlsZVNoYWRlcih3Z2wuVkVSVEVYX1NIQURFUiwgdnNTb3VyY2UsIHdnbCk7XG4gICAgdmFyIGZzID0gY29tcGlsZVNoYWRlcih3Z2wuRlJBR01FTlRfU0hBREVSLCBmc1NvdXJjZSwgd2dsKTtcbiAgICAvLyBDcmVhIHkgbGlua2VhIGVsIHByb2dyYW1hXG4gICAgdmFyIHByb2cgPSB3Z2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIHdnbC5hdHRhY2hTaGFkZXIocHJvZywgdnMpO1xuICAgIHdnbC5hdHRhY2hTaGFkZXIocHJvZywgZnMpO1xuICAgIHdnbC5saW5rUHJvZ3JhbShwcm9nKTtcbiAgICBpZiAoIXdnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2csIHdnbC5MSU5LX1NUQVRVUykpIHtcbiAgICAgICAgYWxlcnQoJ05vIHNlIHB1ZG8gaW5pY2lhbGl6YXIgZWwgcHJvZ3JhbWE6ICcgKyB3Z2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZykpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHByb2c7XG59XG5mdW5jdGlvbiBjb21waWxlU2hhZGVyKHR5cGUsIHNvdXJjZSwgd2dsKSB7XG4gICAgdmFyIHNoYWRlciA9IHdnbC5jcmVhdGVTaGFkZXIodHlwZSk7XG4gICAgd2dsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgd2dsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcbiAgICBpZiAoIXdnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCB3Z2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgIGFsZXJ0KCdPY3VycmnDsyB1biBlcnJvciBkdXJhbnRlIGxhIGNvbXBpbGFjacOzbiBkZWwgc2hhZGVyOicgKyB3Z2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpKTtcbiAgICAgICAgd2dsLmRlbGV0ZVNoYWRlcihzaGFkZXIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHNoYWRlcjtcbn1cbi8vIE11bHRpcGxpY2EgMiBtYXRyaWNlcyB5IGRldnVlbHZlIEEqQi5cbi8vIExvcyBhcmd1bWVudG9zIHkgZWwgcmVzdWx0YWRvIHNvbiBhcnJlZ2xvcyBxdWUgcmVwcmVzZW50YW4gbWF0cmljZXMgZW4gb3JkZW4gY29sdW1uLW1ham9yXG5mdW5jdGlvbiBtYXRyaXhNdWx0KGEsIGIpIHtcbiAgICB2YXIgQyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgdiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IDQ7ICsraykge1xuICAgICAgICAgICAgICAgIHYgKz0gYVtqICsgNCAqIGtdICogYltrICsgNCAqIGldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQy5wdXNoKHYpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBDO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBcIm91dCB2ZWM0IEZyYWdDb2xvcjtcXG5cXG51bmlmb3JtIHZlYzMgY29sb3I7XFxuXFxudm9pZCBtYWluKClcXG57XFxuRnJhZ0NvbG9yID0gdmVjNChjb2xvci54eXosIDEuMGYpO1xcbn0gXFxuXCIiLCJtb2R1bGUuZXhwb3J0cyA9IFwiLy8gbGF5b3V0IChsb2NhdGlvbiA9IDApIGluIHZlYzMgYVBvcztcXG5cXG51bmlmb3JtIG1hdDQgdHJhbnNsYXRpb247XFxudW5pZm9ybSBtYXQ0IHByb2plY3Rpb247XFxudW5pZm9ybSBtYXQ0IHJvdGF0aW9uO1xcbnVuaWZvcm0gbWF0NCBzY2FsZTtcXG5cXG52b2lkIG1haW4oKVxcbntcXG4gICAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uICogdHJhbnNsYXRpb24gKiBzY2FsZSAqIHJvdGF0aW9uICogdmVjNChhUG9zLCAxLjApO1xcbn1cXG5cIiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsInZhciBzY3JpcHRVcmw7XG5pZiAoX193ZWJwYWNrX3JlcXVpcmVfXy5nLmltcG9ydFNjcmlwdHMpIHNjcmlwdFVybCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5sb2NhdGlvbiArIFwiXCI7XG52YXIgZG9jdW1lbnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcuZG9jdW1lbnQ7XG5pZiAoIXNjcmlwdFVybCAmJiBkb2N1bWVudCkge1xuXHRpZiAoZG9jdW1lbnQuY3VycmVudFNjcmlwdClcblx0XHRzY3JpcHRVcmwgPSBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyY1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHNjcmlwdFVybCA9IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmNcblx0fVxufVxuLy8gV2hlbiBzdXBwb3J0aW5nIGJyb3dzZXJzIHdoZXJlIGFuIGF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgeW91IG11c3Qgc3BlY2lmeSBhbiBvdXRwdXQucHVibGljUGF0aCBtYW51YWxseSB2aWEgY29uZmlndXJhdGlvblxuLy8gb3IgcGFzcyBhbiBlbXB0eSBzdHJpbmcgKFwiXCIpIGFuZCBzZXQgdGhlIF9fd2VicGFja19wdWJsaWNfcGF0aF9fIHZhcmlhYmxlIGZyb20geW91ciBjb2RlIHRvIHVzZSB5b3VyIG93biBsb2dpYy5cbmlmICghc2NyaXB0VXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJBdXRvbWF0aWMgcHVibGljUGF0aCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcbnNjcmlwdFVybCA9IHNjcmlwdFVybC5yZXBsYWNlKC8jLiokLywgXCJcIikucmVwbGFjZSgvXFw/LiokLywgXCJcIikucmVwbGFjZSgvXFwvW15cXC9dKyQvLCBcIi9cIik7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBzY3JpcHRVcmw7IiwiIiwiLy8gc3RhcnR1cFxuLy8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vLyBUaGlzIGVudHJ5IG1vZHVsZSBpcyByZWZlcmVuY2VkIGJ5IG90aGVyIG1vZHVsZXMgc28gaXQgY2FuJ3QgYmUgaW5saW5lZFxudmFyIF9fd2VicGFja19leHBvcnRzX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKFwiLi9zcmMvaW5kZXgudHNcIik7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=