[![.github/workflows/npm-publish.yml](https://github.com/matiasfha/svelte-image-preprocessing-clodinary/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/matiasfha/svelte-image-preprocessing-clodinary/actions/workflows/npm-publish.yml)

# Svelte Image Preprocessor: Cloudinary

This package is a pre-processor for Svelte/SvelteKit applications that automates the image optimization using [Cloudinary](https://cloudinary.com/).

It parses your `img` tags, upload the source image to your cloudinary account and replace the content of the html tag with an optimized cloudinary url and srcset.

This package is heavily inspired by [svelte-image](https://github.com/matyunya/svelte-image).

## Installation 

```bash 
yarn add svelte-image-preprocessor-cloudinary -D
```

or 

```
npm install svelte-image-preprocessor-cloudinary -D
```

`svelte-image-preprocessor-cloudinary` needs to be added as dev dependency as Svelte [requires original component source](https://github.com/sveltejs/sapper-template#using-external-components).

## SvelteKit example

In your `svelte.config.js` file add `svelte-image-preprocessor-cloudinary` to the pre-process section of it:

```javascript
....
import preprocess from 'svelte-preprocess';
import { imagePreprocessor } from 'svelte-image-preprocessor-cloudinary';

...
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess(),imagePreprocessor()],

	....
};
...

```
You'll need to setup a couple of environment variables to make this work.

Create an `.env` file and add the following


```bash
CLOUDINARY_CLOUD_NAME= YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET
```


## Configuration and default values 

The image processor accepts a few options

```javascript 
const defaults = {
	// Minimum width for responsive images 
	min_width: 375,
	// Max width for responsive images
	max_width: 1024,
	// Number of images to create for responsive images
	max_images: 10,
}
```
You can change any of this values by passing an object as options to the pre-processor 

```javascript
....
import preprocess from 'svelte-preprocess';
import { imagePreprocessor } from 'svelte-image-preprocessor-cloudinary';

...
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess(),imagePreprocessor({
		min_width: 200
	})],

	....
};
...

```


# CAVEATS 

This package works flawesly for images directly referenced as string literal in your templates like:
`<img src="/some_local_image.png" />` or `<img src="http://remoteimage.png" />` but is not yet possible to handle dynamic sources.

The pre-processor have now way to know the value of a dynamic variable passed as a source in build time, therefore this `<img src={someVariable} />` will not be managed by the pre-processor.




Enjoy!
