import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { fetchPost, PostModel } from "../../utils/postUtils";

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<PostModel | undefined>();

    useEffect(() => {
        if(!slug)
            return;

        const loadPost = async (fileName: string) => { 
            const post = await fetchPost(fileName);
            setPost(post);
        };

        loadPost(slug);
    }, [slug]);

    return (
        <div className="container mx-auto py-8 px-6">
        <div className="prose mt-6">
            <h1>{post?.frontmatter.title}</h1>
            
            <ReactMarkdown>{post?.content}</ReactMarkdown>
        </div>
        </div>
    );
};

export default BlogPost;
