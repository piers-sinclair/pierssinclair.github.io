import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPost, PostModel } from "../../utils/postUtils";
import { format } from "date-fns";
import Giscus from '@giscus/react';
import MarkdownRenderer from "../../components/MarkdownRenderer";


const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<PostModel | undefined>();

    useEffect(() => {
        if (!slug)
            return;

        const loadPost = async (fileName: string) => {
            const post = await fetchPost(fileName);
            setPost(post);
        };

        loadPost(slug);
    }, [slug]);

    if (!post) return <div>Loading...</div>;
    return (
        <div className="container mx-auto py-12 max-w-screen-md">
            <h1 className="text-5xl font-bold mb-4 text-gray-100">{post.frontmatter.title}</h1>
            <p className="text-gray-400 mb-4">{format(new Date(post.frontmatter.date), 'dd MMM, yyyy')} · {post.frontmatter.author}</p>
            <hr className="border-gray-700 mb-8" />

            <div className="prose prose-lg prose-invert max-w-none text-sm">
            <MarkdownRenderer content={post.content} />
            </div>
            <Giscus
                repo="piers-sinclair/pierssinclairssw.github.io"
                repoId="MDEwOlJlcG9zaXRvcnkzODQ5NDU4NDk="
                category="General"
                categoryId="DIC_kwDOFvHOuc4Cf9Sl"
                mapping="pathname"
                strict="0"
                reactionsEnabled="1"
                emitMetadata="0"
                inputPosition="bottom"
                theme="dark"
                lang="en"
                loading="lazy"
            />
        </div>
    );
};

export default BlogPost;
