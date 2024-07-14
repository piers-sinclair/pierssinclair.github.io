import remarkGfm from 'remark-gfm';
import createMDX from '@next/mdx';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'blog'); // Adjust 'posts' to your blog posts directory
  const filenames = fs.readdirSync(postsDirectory);

  const paths = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    const slugParts = data.category.split('/').concat(data.uri);
    return {
      slug: slugParts,
      redirectFrom: data.redirect_from,
    };
  });

  return paths.filter(({ redirectFrom }) => redirectFrom && redirectFrom.length);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  // Add the redirects function here
  async redirects() {
    const paths = await generateStaticParams();
    let redirects = [];

    paths.forEach(({ slug, redirectFrom }) => {
      if (redirectFrom) {
        redirectFrom.forEach((oldUrl) => {
          const newUrl = `/blog/${Array.isArray(slug) ? slug.join('/') : slug}`; // Ensure slug is an array
          redirects.push({
            source: oldUrl,
            destination: newUrl,
            permanent: true,
          });
        });
      }
    });

    return redirects;  
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);