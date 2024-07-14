import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import { MDXRemote } from 'next-mdx-remote/rsc'

export async function generateStaticParams() {
    const blogDir = 'blog';
    const files = fs.readdirSync(path.join(blogDir))

    const paths = files.map((file) => {
        const fileContent = fs.readFileSync(path.join(blogDir, file), "utf-8");
        const { data: frontMatter } = matter(fileContent);
        
        // Use category and uri from frontMatter to construct the slug
        const slugParts = frontMatter.category.split('/').concat(frontMatter.uri);
    
        return {
            meta: frontMatter,
            slug: slugParts,
            redirectFrom: frontMatter.redirect_from
        };
    });

    return paths;
}


function getPost({slug}:{slug : string[]}){
    const uri = slug.pop();
    const blogDir = 'blog';
    const files = fs.readdirSync(path.join(blogDir));
    let markdownFile = '';

    for (const file of files) {
        const fileContent = fs.readFileSync(path.join(blogDir, file), 'utf-8');
        const { data: frontMatter } = matter(fileContent);
        if (frontMatter.uri === uri) {
            markdownFile = fileContent;
            break;
        }
    }

    if (!markdownFile) {
        throw new Error('Post not found');
    }

    const { data: frontMatter, content } = matter(markdownFile);

    return {
        frontMatter,
        slug,
        content
    };
}

export default function Post({ params } :any) {
    const props = getPost(params);

    return (
        <article className='prose prose-sm md:prose-base lg:prose-lg prose-slate !prose-invert mx-auto'>
            <h1>{props.frontMatter.title}</h1>
            
            <MDXRemote source={props.content}/>
        </article>
    )
}