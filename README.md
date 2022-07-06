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

```
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
CLODUNARY_CLOUD_NAME= YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET
```


Enjoy!