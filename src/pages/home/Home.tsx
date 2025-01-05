import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, PostModel } from "../../utils/postUtils";
import { format } from 'date-fns';

const Home: React.FC = () => {
    const [posts, setPosts] = useState<PostModel[]>([]);

    useEffect(() => {
        const loadPosts = async () => {
            const posts = await fetchPosts();

            const sortedPosts = posts.sort((a, b) => {
                const dateA = new Date(a.frontmatter.date).getTime();
                const dateB = new Date(b.frontmatter.date).getTime();
                return dateB - dateA;
            });

            setPosts(sortedPosts);
        };

        loadPosts();
    }, []);

    if (!posts || posts.length === 0) return <div>Loading...</div>;

    return (
        <div className="container mx-auto py-4 px-4 text-center">
            <div className="mb-4">
                <img
                    src="/assets/images/2021-07-13-piers.jpg"
                    loading="lazy"
                    alt="Piers Sinclair"
                    className="rounded-lg w-full max-w-3xl h-auto mx-auto"
                />
            </div>
            <ul className="space-y-4">
                {posts.map((post) => (
                    <li key={post.slug} className="p-4 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300 text-left mx-auto max-w-3xl">
                        <p className="text-sm text-gray-400 mb-2">
                            {format(new Date(post.frontmatter.date), 'dd MMM, yyyy')}
                        </p>
                        <Link to={`/post/${post.slug}`} className="group">
                            <h2 className="text-2xl text-blue-400 group-hover:text-blue-200 transition-all duration-300 ease-in-out transform hover:scale-105">
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
