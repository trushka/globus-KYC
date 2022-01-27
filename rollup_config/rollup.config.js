import { terser } from '/node_modules/rollup-plugin-terser'; // path to terser plagin
function glsl() {

	const imported=[];

	return {

		transform( code, id ) {

			// if ( /(?<!\/|Sprite)Material\./.test( id )  ) {
			// 	const shPrefix=id.replace(/.*[\/\\]|\..+/g, '').toLowerCase().replace('material', '').replace('linebasic', 'meshbasic'),
			// 	transformed = `
			// 	import {ShaderChunk} from '../renderers/shaders/ShaderChunk.js';
			// 	import {${shPrefix}_vert} from '../renderers/shaders/ShaderLib/${shPrefix}_vert.glsl';
			// 	import {${shPrefix}_frag} from '../renderers/shaders/ShaderLib/${shPrefix}_frag.glsl';
			// 	ShaderChunk.${shPrefix}_vert=${shPrefix}_vert;
			// 	ShaderChunk.${shPrefix}_frag=${shPrefix}_frag;
			// 	`+ code;
			// 	console.log(shPrefix);
			// 	return transformed
			// }

			// if ( /ShaderChunk\./.test( id ) ) {//
			// 	console.log(id.replace(/\\/g, '/'), __dirname);
			// 	const url=new URL('./ShaderLib.js', id.replace(/\\/g, '/')).href;
			// 	//console.log(url, require(url))
			// 	return 'export const ShaderChunk = {}'
			// }
			if ( !/\.glsl$/.test( id ) ) return;

			let transformedCode = '',
				preparedCode = code				
				.replace( /[ \s]*\/\/.*$/gm, '' ) // remove //
				.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
				.replace('\t', '')
				.replace(/(?<!#include)\s?([=><,+\-*()])\s?/g, '$1')
				.replace( /\s^$/gm, '' ), // # \n+ to \n
				chunks=code.match(/(?<=#include <).+?(?=>)/g);

			if (/ShaderLib/.test(id)) {
				chunks.forEach(ch=>{
					if (imported.indexOf(ch)+1) return;
					transformedCode+=`export {${ch}} from "../ShaderChunk/${ch}.glsl";\n`
					imported.push(ch);
				})
			}
			return {
				code: transformedCode + `export let ${id.replace(/.*[\/\\]|\..+/g, '')} = \`${preparedCode}\`;`,
				map: { mappings: '' }
			};

		}

	};

}

export default {
	treeshake: {
		preset: 'smallest',
		propertyReadSideEffects: false,
		moduleSideEffects: false
	},
	input: 'three.js',
	plugins: [
		glsl(),
		terser({
			format:{ecma: 2018},
			compress: {ecma: 2018, drop_console: true},
		})
	],
	// sourceMap: true,
	output: [
		{
			format: 'es',
			file: '../three.min.js',
			indent: '\t'
		}
	]
};
