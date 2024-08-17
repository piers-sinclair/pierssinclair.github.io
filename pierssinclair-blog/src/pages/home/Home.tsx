import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, PostModel } from "../../utils/postUtils";
import { format } from 'date-fns';

const Home: React.FC = () => {
    const [posts, setPosts] = useState<PostModel[]>([]);

    useEffect(() => {
        const loadPosts = async () => {
            const posts = await fetchPosts();
            setPosts(posts);
        };

        loadPosts();
    }, []);

    if(!posts || posts.length === 0) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-6 text-gray-100">Blog Posts</h1>
            <ul>
                {posts.map((post) => (
                    <li key={post.slug} className="mb-8">
                    <p className="text-sm text-gray-500 mb-1">
                        {format(new Date(post.frontmatter.date), 'dd MMM, yyyy')}
                    </p>
                    <Link to={`/post/${post.slug}`} className="group">
                        <h2 className="text-xl font-semibold text-blue-500 hover:text-blue-300 transition duration-300">
                            {post.frontmatter.title}
                        </h2>
                    </Link>
                </li>
                ))}
            </ul>
        </div>
    );
};

export default Home;
