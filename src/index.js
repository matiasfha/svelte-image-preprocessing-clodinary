import { parse, walk} from 'svelte/compiler';
import fs from 'node:fs';
import path from 'node:path'
import 'dotenv/config'
import { v2 as cloudinary } from 'cloudinary';

/**  @typedef {import('svelte/types/compiler/preprocess').PreprocessorGroup} PreprocessorGroup */
/** @typedef { import('estree').BaseNode} BaseNode */
/** @typedef { import('estree-walker/types/sync').SyncHandler} SyncHandler */
/** @typedef { import('estree-walker/types/async').AsyncHandler} AsyncHandler */
/** @typedef {{willProcess: boolean; reason: string | undefined; paths: string | undefined }} WillProcessMsg */
/** @typedef {import('./').Node} Node */



cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

const IS_EXTERNAL = /^(https?:)?\/\//i;

/** 
 * @param {string} imagePath
 * Upload image represented by imagePath to cloudinary
 * returns a promise that resolves to the public_id of the uploaded image
 * @return Promise<{import('cloudinary/types/index').UploadApiResponse}'}>
 */
async function uploadImage(imagePath) {
	const options = {
		use_filename: true,
		unique_filename: false,
		overwrite: true,
		resource_type: 'image',
		responsive_breakpoints: [{
			create_derived: false,
			bytes_step: 20000,
			min_width: 200, max_width: 1000,
			max_images: 20
		}]
		
	};

	try {
		// Upload the image
		return await cloudinary.uploader.upload(imagePath, options);
		
	} catch (error) {
		console.error(error);
	}
}

/**
 * 
 * @param {Node} node 
 * @param {string} attr 
 * @returns string
 */
function getProp(node, attr) {
	const prop = (node.attributes || []).find((a) => a.name === attr);
	return prop ? prop.value : undefined;
}

/**
 * 
 * @param {Node} node 
 * @returns string
 */
function getSrc(node) {
	try {
		return getProp(node, 'src') || [{}];
	} catch (err) {
		console.log('Was unable to retrieve image src', err);
		return [{}];
	}
}
/**
 * 
 * @param {string} content 
 * @param {string} value 
 * @param {number} start 
 * @param {number} end 
 * @param {number} offset 
 * @returns {{content: string, offset: number}}
 */
function insert(content, value, start, end, offset) {
	return {
		content: content.substring(0, start + offset) + value + content.substring(end + offset),
		offset: offset + value.length - (end - start)
	};
}

/**
 * 
 * @param {string} reason 
 * @returns WillProcessMsg
 */
function willNotProcess(reason) {
	return {
		willNotProcess: true,
		reason,
		paths: undefined
	};
}

/**
 * 
 * @param {string} nodeSrc 
 * @returns WillProcessMsg
 */
function willProcess(nodeSrc) {
	return {
		willNotProcess: false,
		reason: undefined,
		paths: nodeSrc
	};
}
/**
 * 
 * @param {Node} node 
 * @returns WillProcessMsg
 */
async function getProcessingPathsForNode(node) {
    //@ts-ignore 
	const [value] = getSrc(node);

	// dynamic or empty value
	if (value.type === 'MustacheTag' || value.type === 'AttributeShorthand') {
		return willNotProcess(`Cannot process a dynamic value: ${value.type}`);
	}
	if (!value.data) {
		return willNotProcess('The `src` is blank');
	}

	if (IS_EXTERNAL.test(value.data)) {
		return willProcess(value.data);
	} else {
		let location = value.data.replace(/^\/([^\/])/, '$1');
		const fullPath = path.resolve('./static', location);
		if (fs.existsSync(fullPath)) {
			return willProcess(location);
		} else {
			return willNotProcess(`The image file does not exist: ${fullPath}`);
		}
	}
}
/**
 * 
 * @param {Promise<{ content: string, offset: number}>} edited 
 * @param {Node} node 
 * @returns Promise<{content: string, offset: number}>
 */
async function replaceInImg(edited, node) {
	const { content, offset } = await edited;

	const [{ start, end }] = getSrc(node);

	try {
		const { paths } = await getProcessingPathsForNode(node);
		if (paths) {
			const location = !IS_EXTERNAL.test(paths) ? `./static/${paths}` : paths;
			const result = await uploadImage(location);
			
			if (result?.public_id) {
				
				const newSrc = cloudinary.url(result.public_id, {
					sizes: "1000vw",
					client_hints: true,
					secure: true,
					quality: "auto",
					dpr: "auto",
					fetch_format: 'auto',
					width: 'auto',
					crop: 'scale',
					stransformation: [
						{ responsive: true },
						{ responsive_placeholder: "blank"},
					]
				});
				let outUri = `${newSrc}" loading="lazy`;
				
				
				const { srcset, sizes} = result.responsive_breakpoints[0].breakpoints.reduce((
					/** @type {{ srcset: string, sizes: string}} */
					acc, 
					/** @type {{ secure_url: string; width: number }} */ 
					current
				) => {
					acc.srcset += `${current.secure_url} ${current.width}w, `;
					acc.sizes += `${current.width}px, `;
					return acc;
				}, { srcset: "", sizes: "" });
				
				outUri+=`" srcset="${srcset}" sizes="(max-width: 1000vw) ${sizes.slice(0,-2)}`;	
				const toInsert = insert(content, outUri, start, end, offset);
				
				return toInsert
			}
		}

		return { content, offset };
	} catch (e) {
		console.error(e);
		return { content, offset };
	}
}



/**
 * @returns () => PreprocessorGroup
 */
export const imagePreprocessor = () => {
	return {
		/** @type {import('svelte/types/compiler/preprocess').MarkupPreprocessor} */
		markup: async ({ content }) => {
			if (!content.includes('<img')) return { code: content };

			let ast;
			/** @type Node[] */
			const imageNodes = [];

			try {
				ast = parse(content);
			} catch (e) {
				console.error(e, 'Error parsing component content');
			}
			/**  @param { BaseNode } ast*/
			//@ts-ignore @TODO svelte.parse returns an Ast node, but we need a BaseNode for svelte.walk
			walk(ast, {
				/** @type {SyncHandler} 
				*/
				enter: (node)=> {
					if (!['Element', 'Fragment'].includes(node.type)) {
						return;
					}
					//@ts-ignore BaseNode doesn't have a name attribute even tho the attribute exists
					if (node.name === 'img') {
                        //@ts-ignore BaseNode is not the same as Node
                        imageNodes.push(node);
						return;
					}
				}
			});
			if (!imageNodes.length) return { code: content };


			const beforeProcessed = Promise.resolve({
				content,
				offset: 0
			});
			
			const processed = await imageNodes.reduce(async (edited, node) => {
				if (node.name === 'img') {
					return replaceInImg(edited, node);
					
				}
				return Promise.resolve(edited);
			}, beforeProcessed);
			
			return {
				
				code: processed.content
			};
			
		}
	};
};
