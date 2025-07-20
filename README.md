# Data Diversity Lab Website

## How to run this site locally?

First, check that `Node.js` (v12 or later) and `npm` are installed:

```
node -v
npm -v dependencies
```

If they are not installed, you can use [homebrew to install them](https://formulae.brew.sh/formula/node):

```
brew install node
```

Next, install dependencies that are requiered to run the website locally using `npm`:

```
npm install
```

Finally, serve the site locally:

```
npx @11ty/eleventy --serve
```

The site will be at `http://localhost:8080/`.

